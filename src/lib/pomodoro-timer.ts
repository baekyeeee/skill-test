import { useCallback, useEffect, useState } from "react";

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

export interface UsePomodoroTimerResult {
  state: PomodoroState;
  /** Milliseconds left in the running Phase, or null when not running. */
  remainingMs: number | null;
  start: () => void;
}

interface InternalState {
  state: PomodoroState;
  phaseEndAt: number | null;
  now: number;
}

function initialInternalState(): InternalState {
  // `now` is only read while status === "running", which only happens after
  // `start()` runs (an event handler) — safe to default without a clock read here,
  // which would otherwise get baked into the prerender as a stale value.
  return { state: initialState(), phaseEndAt: null, now: 0 };
}

export function usePomodoroTimer(): UsePomodoroTimerResult {
  const [internal, setInternal] = useState<InternalState>(initialInternalState);

  const start = useCallback(() => {
    const startedAt = Date.now();
    setInternal((prev) => {
      if (prev.state.status !== "awaitingManualStart") return prev;
      return {
        state: { ...prev.state, status: "running" },
        phaseEndAt:
          startedAt + durationMs(prev.state.phase, prev.state.settings),
        now: startedAt,
      };
    });
  }, []);

  useEffect(() => {
    if (internal.state.status !== "running") return;

    const id = setInterval(() => {
      const current = Date.now();
      setInternal((prev) => {
        if (prev.phaseEndAt !== null && current >= prev.phaseEndAt) {
          return {
            state: { ...prev.state, status: "awaitingManualStart" },
            phaseEndAt: null,
            now: current,
          };
        }
        return { ...prev, now: current };
      });
    }, TICK_MS);

    return () => clearInterval(id);
  }, [internal.state.status]);

  const remainingMs =
    internal.state.status === "running" && internal.phaseEndAt !== null
      ? Math.max(0, internal.phaseEndAt - internal.now)
      : null;

  return { state: internal.state, remainingMs, start };
}
