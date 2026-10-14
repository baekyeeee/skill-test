import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playChime } from "./chime";

export type Phase = "focus" | "shortBreak" | "longBreak";
export type Status = "awaitingManualStart" | "running" | "paused";

export interface PomodoroSettings {
  focusMin: number;
  shortBreakMin: number;
  longBreakMin: number;
  cyclesBeforeLongBreak: number;
}

// Local calendar day, e.g. "2024-01-01", keyed to the day a Focus Session started.
export type DayKey = string;

export interface PomodoroState {
  settings: PomodoroSettings;
  phase: Phase;
  status: Status;
  cycleCount: number;
  dailyTotals: Record<DayKey, number>;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  cyclesBeforeLongBreak: 4,
};

export const SETTINGS_BOUNDS: Record<
  keyof PomodoroSettings,
  { min: number; max: number }
> = {
  focusMin: { min: 1, max: 180 },
  shortBreakMin: { min: 1, max: 180 },
  longBreakMin: { min: 1, max: 180 },
  cyclesBeforeLongBreak: { min: 1, max: 12 },
};

function clampSetting(key: keyof PomodoroSettings, value: number): number {
  const { min, max } = SETTINGS_BOUNDS[key];
  return Math.min(max, Math.max(min, Math.round(value)));
}

export const PHASE_LABEL: Record<Phase, string> = {
  focus: "Focus Session（專注）",
  shortBreak: "Short Break（短休息）",
  longBreak: "Long Break（長休息）",
};

export const STATUS_LABEL: Record<Status, string> = {
  awaitingManualStart: "Awaiting Start（等待手動開始）",
  running: "Running（進行中）",
  paused: "Paused（已暫停）",
};

function initialState(): PomodoroState {
  return {
    settings: DEFAULT_SETTINGS,
    phase: "focus",
    status: "awaitingManualStart",
    cycleCount: 0,
    dailyTotals: {},
  };
}

function durationMs(phase: Phase, settings: PomodoroSettings): number {
  const minutes =
    phase === "focus"
      ? settings.focusMin
      : phase === "shortBreak"
        ? settings.shortBreakMin
        : settings.longBreakMin;
  return minutes * 60 * 1000;
}

const TICK_MS = 250;
const STORAGE_KEY = "pomodoro-timer-state";

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

export interface UsePomodoroTimerOptions {
  /** Clock provider, injectable for tests. Keep the reference stable across renders. */
  now?: () => number;
  /** Storage adapter, defaults to `localStorage`. Keep the reference stable across renders. */
  storage?: StorageLike | null;
  /** Called once per Phase end (natural or skipped). Defaults to the built-in chime. Keep the reference stable across renders. */
  playSound?: () => void | Promise<void>;
}

export interface DailyHistoryEntry {
  day: DayKey;
  totalMs: number;
}

export interface UsePomodoroTimerResult {
  state: PomodoroState;
  /** Milliseconds left in the running or paused Phase, or null when awaiting start. */
  remainingMs: number | null;
  /** Focus time credited to the local calendar day of the last known clock reading. */
  todayTotalMs: number;
  /** One Daily Focus Total per recorded day, newest first. */
  history: DailyHistoryEntry[];
  start: () => void;
  pause: () => void;
  resume: () => void;
  skip: () => void;
  /** Applies to the next Phase; the running one keeps its end time. Values are rounded and clamped. */
  updateSettings: (changes: Partial<PomodoroSettings>) => void;
  resetSettings: () => void;
}

interface InternalState {
  state: PomodoroState;
  /** When the current Phase began; keys the Daily Focus Total it credits. */
  phaseStartedAt: number | null;
  phaseEndAt: number | null;
  /** Frozen remaining time while paused; null otherwise. */
  pausedRemainingMs: number | null;
  now: number;
  /** Incremented on every Phase end so an effect can play the sound exactly once per end. */
  phaseEndCount: number;
}

function initialInternalState(): InternalState {
  // `now` is only read while status === "running", which only happens after
  // `start()` runs (an event handler) — safe to default without a clock read here,
  // which would otherwise get baked into the prerender as a stale value.
  return {
    state: initialState(),
    phaseStartedAt: null,
    phaseEndAt: null,
    pausedRemainingMs: null,
    now: 0,
    phaseEndCount: 0,
  };
}

/** Local calendar day, e.g. "2024-01-01". */
function dayKey(timestamp: number): DayKey {
  const d = new Date(timestamp);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Ends the current Phase at `at`. A Focus Session credits `creditedMs` to the
 * day it started, advances the Cycle and auto-starts a Break; a Break always
 * hands back to a manually-started Focus Session, and a Long Break closes the Cycle.
 */
function completePhase(
  prev: InternalState,
  at: number,
  creditedMs: number,
): InternalState {
  const { state } = prev;

  if (state.phase === "focus") {
    const cycleCount = state.cycleCount + 1;
    const phase: Phase =
      cycleCount >= state.settings.cyclesBeforeLongBreak
        ? "longBreak"
        : "shortBreak";
    const startedKey = dayKey(prev.phaseStartedAt ?? at);
    const dailyTotals =
      creditedMs > 0
        ? {
            ...state.dailyTotals,
            [startedKey]: (state.dailyTotals[startedKey] ?? 0) + creditedMs,
          }
        : state.dailyTotals;
    return {
      state: { ...state, phase, status: "running", cycleCount, dailyTotals },
      phaseStartedAt: at,
      phaseEndAt: at + durationMs(phase, state.settings),
      pausedRemainingMs: null,
      now: at,
      phaseEndCount: prev.phaseEndCount + 1,
    };
  }

  return {
    state: {
      ...state,
      phase: "focus",
      status: "awaitingManualStart",
      cycleCount: state.phase === "longBreak" ? 0 : state.cycleCount,
    },
    phaseStartedAt: null,
    phaseEndAt: null,
    pausedRemainingMs: null,
    now: at,
    phaseEndCount: prev.phaseEndCount + 1,
  };
}

/**
 * Reconciles real elapsed time: every auto-starting Phase whose absolute end
 * time has passed completes in order, stopping at the manual-start gate.
 */
function settle(prev: InternalState, now: number): InternalState {
  let current = prev;
  while (
    current.state.status === "running" &&
    current.phaseEndAt !== null &&
    now >= current.phaseEndAt
  ) {
    current = completePhase(
      current,
      current.phaseEndAt,
      durationMs(current.state.phase, current.state.settings),
    );
  }
  return current.now === now ? current : { ...current, now };
}

function defaultStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function isNumberOrNull(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function loadInternalState(storage: StorageLike | null): InternalState | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const { state } = saved;
    const settings = state?.settings;
    const valid =
      ["focus", "shortBreak", "longBreak"].includes(state?.phase) &&
      ["awaitingManualStart", "running", "paused"].includes(state?.status) &&
      Number.isInteger(state?.cycleCount) &&
      typeof state?.dailyTotals === "object" &&
      state.dailyTotals !== null &&
      ["focusMin", "shortBreakMin", "longBreakMin", "cyclesBeforeLongBreak"].every(
        (key) => typeof settings?.[key] === "number" && settings[key] > 0,
      ) &&
      isNumberOrNull(saved.phaseStartedAt) &&
      isNumberOrNull(saved.phaseEndAt) &&
      isNumberOrNull(saved.pausedRemainingMs) &&
      (state.status !== "running" || saved.phaseEndAt !== null) &&
      (state.status !== "paused" || saved.pausedRemainingMs !== null);
    if (!valid) return null;
    return {
      state,
      phaseStartedAt: saved.phaseStartedAt,
      phaseEndAt: saved.phaseEndAt,
      pausedRemainingMs: saved.pausedRemainingMs,
      now: 0,
      phaseEndCount: 0,
    };
  } catch {
    return null;
  }
}

function saveInternalState(storage: StorageLike | null, internal: InternalState) {
  if (!storage) return;
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        state: internal.state,
        phaseStartedAt: internal.phaseStartedAt,
        phaseEndAt: internal.phaseEndAt,
        pausedRemainingMs: internal.pausedRemainingMs,
      }),
    );
  } catch {
    // Storage full or blocked: the timer keeps working in memory.
  }
}

export function usePomodoroTimer(
  options: UsePomodoroTimerOptions = {},
): UsePomodoroTimerResult {
  const clock = options.now ?? Date.now;
  const storage =
    options.storage === undefined ? defaultStorage() : options.storage;
  const playSound = options.playSound ?? playChime;

  const [internal, setInternal] = useState<InternalState>(initialInternalState);
  const [hydrated, setHydrated] = useState(false);

  // Restore after mount (not in the initializer) so the first client render
  // matches the prerendered markup.
  useEffect(() => {
    const saved = loadInternalState(storage);
    // Syncing from an external system (localStorage) on mount is the one
    // legitimate setState-in-effect: it can't run in the initializer without a
    // hydration mismatch.
    /* eslint-disable react-hooks/set-state-in-effect */
    // Phases that finished while the page was closed settle silently.
    if (saved) setInternal({ ...settle(saved, clock()), phaseEndCount: 0 });
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storage, clock]);

  const announcedPhaseEnds = useRef(0);
  useEffect(() => {
    if (internal.phaseEndCount <= announcedPhaseEnds.current) return;
    announcedPhaseEnds.current = internal.phaseEndCount;
    try {
      // A blocked or failing sound must never affect the timer.
      Promise.resolve(playSound()).catch(() => {});
    } catch {
      // Same: a synchronous failure just means no sound.
    }
  }, [internal.phaseEndCount, playSound]);

  // Persist only the fields that survive a reload, so the per-tick `now`
  // update doesn't rewrite storage four times a second.
  const { state, phaseStartedAt, phaseEndAt, pausedRemainingMs } = internal;
  useEffect(() => {
    if (!hydrated) return;
    saveInternalState(storage, {
      state,
      phaseStartedAt,
      phaseEndAt,
      pausedRemainingMs,
      now: 0,
      phaseEndCount: 0,
    });
  }, [hydrated, storage, state, phaseStartedAt, phaseEndAt, pausedRemainingMs]);

  const start = useCallback(() => {
    const startedAt = clock();
    setInternal((prev) => {
      if (prev.state.status !== "awaitingManualStart") return prev;
      return {
        state: { ...prev.state, status: "running" },
        phaseStartedAt: startedAt,
        phaseEndAt:
          startedAt + durationMs(prev.state.phase, prev.state.settings),
        pausedRemainingMs: null,
        now: startedAt,
        phaseEndCount: prev.phaseEndCount,
      };
    });
  }, [clock]);

  const pause = useCallback(() => {
    const pausedAt = clock();
    setInternal((prev) => {
      if (prev.state.status !== "running" || prev.phaseEndAt === null) {
        return prev;
      }
      return {
        ...prev,
        state: { ...prev.state, status: "paused" },
        phaseEndAt: null,
        pausedRemainingMs: Math.max(0, prev.phaseEndAt - pausedAt),
        now: pausedAt,
      };
    });
  }, [clock]);

  const resume = useCallback(() => {
    const resumedAt = clock();
    setInternal((prev) => {
      if (prev.state.status !== "paused" || prev.pausedRemainingMs === null) {
        return prev;
      }
      return {
        ...prev,
        state: { ...prev.state, status: "running" },
        phaseEndAt: resumedAt + prev.pausedRemainingMs,
        pausedRemainingMs: null,
        now: resumedAt,
      };
    });
  }, [clock]);

  const skip = useCallback(() => {
    const skippedAt = clock();
    setInternal((prev) => {
      if (prev.state.status === "awaitingManualStart") return prev;
      const full = durationMs(prev.state.phase, prev.state.settings);
      const remaining =
        prev.state.status === "paused"
          ? (prev.pausedRemainingMs ?? full)
          : Math.max(0, (prev.phaseEndAt ?? skippedAt) - skippedAt);
      return completePhase(prev, skippedAt, full - remaining);
    });
  }, [clock]);

  const updateSettings = useCallback((changes: Partial<PomodoroSettings>) => {
    setInternal((prev) => {
      const settings = { ...prev.state.settings };
      for (const key of Object.keys(SETTINGS_BOUNDS) as Array<
        keyof PomodoroSettings
      >) {
        const value = changes[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          settings[key] = clampSetting(key, value);
        }
      }
      return { ...prev, state: { ...prev.state, settings } };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setInternal((prev) => ({
      ...prev,
      state: { ...prev.state, settings: DEFAULT_SETTINGS },
    }));
  }, []);

  useEffect(() => {
    if (internal.state.status !== "running") return;

    const id = setInterval(() => {
      const current = clock();
      setInternal((prev) => settle(prev, current));
    }, TICK_MS);

    return () => clearInterval(id);
  }, [internal.state.status, clock]);

  const remainingMs =
    internal.state.status === "running" && internal.phaseEndAt !== null
      ? Math.max(0, internal.phaseEndAt - internal.now)
      : internal.state.status === "paused"
        ? internal.pausedRemainingMs
        : null;

  const todayTotalMs =
    internal.now === 0
      ? 0
      : (internal.state.dailyTotals[dayKey(internal.now)] ?? 0);

  const history = useMemo(
    () =>
      Object.entries(state.dailyTotals)
        .map(([day, totalMs]) => ({ day, totalMs }))
        // ISO day keys sort chronologically as plain strings.
        .sort((a, b) => b.day.localeCompare(a.day)),
    [state.dailyTotals],
  );

  return {
    state: internal.state,
    remainingMs,
    todayTotalMs,
    history,
    start,
    pause,
    resume,
    skip,
    updateSettings,
    resetSettings,
  };
}
