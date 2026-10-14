import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  DEFAULT_SETTINGS,
  usePomodoroTimer,
  type StorageLike,
} from "./pomodoro-timer";

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

const MIN = 60 * 1000;

const FOCUS_DURATION_MS = DEFAULT_SETTINGS.focusMin * 60 * 1000;
const SHORT_BREAK_MS = DEFAULT_SETTINGS.shortBreakMin * 60 * 1000;
const LONG_BREAK_MS = DEFAULT_SETTINGS.longBreakMin * 60 * 1000;

describe("usePomodoroTimer", () => {
  it("starts awaiting a manually-started Focus Session with default settings", () => {
    const { result } = renderHook(() => usePomodoroTimer());

    expect(result.current.state).toEqual({
      settings: {
        focusMin: 25,
        shortBreakMin: 5,
        longBreakMin: 15,
        cyclesBeforeLongBreak: 4,
      },
      phase: "focus",
      status: "awaitingManualStart",
      cycleCount: 0,
      dailyTotals: {},
    });
  });

  it("starts the Focus Session and exposes a remaining time within its duration", () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.start();
    });

    expect(result.current.state.status).toBe("running");
    expect(result.current.remainingMs).toBeGreaterThan(0);
    expect(result.current.remainingMs).toBeLessThanOrEqual(FOCUS_DURATION_MS);
  });

  it("ignores start when a Phase is already running", () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.start();
    });
    const remainingAfterFirstStart = result.current.remainingMs;

    act(() => {
      result.current.start();
    });

    expect(result.current.state.status).toBe("running");
    expect(result.current.remainingMs).toBe(remainingAfterFirstStart);
  });

  it("automatically starts a Short Break when a Focus Session naturally completes", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(FOCUS_DURATION_MS + 500);
      });

      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.status).toBe("running");
      expect(result.current.state.cycleCount).toBe(1);
      expect(result.current.remainingMs).toBeGreaterThan(0);
      expect(result.current.remainingMs).toBeLessThanOrEqual(SHORT_BREAK_MS);
    } finally {
      vi.useRealTimers();
    }
  });

  it("runs a full Cycle: Long Break after the last Focus Session, Cycle count resets, every Focus Session needs a manual start", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());
      const { cyclesBeforeLongBreak } = DEFAULT_SETTINGS;

      for (let i = 1; i <= cyclesBeforeLongBreak; i++) {
        expect(result.current.state.phase).toBe("focus");
        expect(result.current.state.status).toBe("awaitingManualStart");

        act(() => {
          result.current.start();
        });
        act(() => {
          vi.advanceTimersByTime(FOCUS_DURATION_MS + 500);
        });

        expect(result.current.state.cycleCount).toBe(i);
        expect(result.current.state.status).toBe("running");
        if (i < cyclesBeforeLongBreak) {
          expect(result.current.state.phase).toBe("shortBreak");
          act(() => {
            vi.advanceTimersByTime(SHORT_BREAK_MS + 500);
          });
        } else {
          expect(result.current.state.phase).toBe("longBreak");
          act(() => {
            vi.advanceTimersByTime(LONG_BREAK_MS + 500);
          });
        }
      }

      expect(result.current.state.phase).toBe("focus");
      expect(result.current.state.status).toBe("awaitingManualStart");
      expect(result.current.state.cycleCount).toBe(0);
      expect(result.current.remainingMs).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps the remaining time fixed while paused and resumes counting down", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      act(() => {
        result.current.pause();
      });
      const remainingAtPause = result.current.remainingMs;

      expect(result.current.state.status).toBe("paused");
      expect(remainingAtPause).toBe(FOCUS_DURATION_MS - 60_000);

      act(() => {
        vi.advanceTimersByTime(FOCUS_DURATION_MS * 2);
      });
      expect(result.current.state.status).toBe("paused");
      expect(result.current.state.phase).toBe("focus");
      expect(result.current.remainingMs).toBe(remainingAtPause);

      act(() => {
        result.current.resume();
      });
      expect(result.current.state.status).toBe("running");
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(result.current.remainingMs).toBe(remainingAtPause! - 30_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("ignores pause and resume when they are not legal for the current status", () => {
    const { result } = renderHook(() => usePomodoroTimer());

    act(() => {
      result.current.pause();
      result.current.resume();
    });
    expect(result.current.state.status).toBe("awaitingManualStart");

    act(() => {
      result.current.start();
      result.current.resume();
    });
    expect(result.current.state.status).toBe("running");
  });

  it("skipping a Focus Session counts the Cycle and auto-starts the next Break", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(60_000);
      });
      act(() => {
        result.current.skip();
      });

      expect(result.current.state.cycleCount).toBe(1);
      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.status).toBe("running");
      expect(result.current.remainingMs).toBeLessThanOrEqual(SHORT_BREAK_MS);
    } finally {
      vi.useRealTimers();
    }
  });

  it("skipping a paused Focus Session still advances; skipping a Break awaits a manual Focus start; skip is ignored when awaiting start", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.skip();
      });
      expect(result.current.state.phase).toBe("focus");
      expect(result.current.state.cycleCount).toBe(0);

      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.pause();
      });
      act(() => {
        result.current.skip();
      });
      expect(result.current.state.phase).toBe("shortBreak");
      expect(result.current.state.status).toBe("running");
      expect(result.current.state.cycleCount).toBe(1);

      act(() => {
        result.current.skip();
      });
      expect(result.current.state.phase).toBe("focus");
      expect(result.current.state.status).toBe("awaitingManualStart");
      expect(result.current.state.cycleCount).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("skipping the last Focus Session of a Cycle starts a Long Break", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());
      const { cyclesBeforeLongBreak } = DEFAULT_SETTINGS;

      for (let i = 1; i < cyclesBeforeLongBreak; i++) {
        act(() => {
          result.current.start();
        });
        act(() => {
          result.current.skip();
        });
        act(() => {
          result.current.skip();
        });
      }
      act(() => {
        result.current.start();
      });
      act(() => {
        result.current.skip();
      });

      expect(result.current.state.phase).toBe("longBreak");
      expect(result.current.state.cycleCount).toBe(cyclesBeforeLongBreak);
    } finally {
      vi.useRealTimers();
    }
  });

  describe("Daily Focus Total and persistence", () => {
    it("credits only the elapsed (unpaused) time of an early-skipped Focus Session to its start day", () => {
      let t = new Date(2024, 0, 1, 10, 0).getTime();
      const clock = () => t;
      const storage = memoryStorage();
      vi.useFakeTimers();
      try {
        const { result } = renderHook(() =>
          usePomodoroTimer({ now: clock, storage }),
        );

        act(() => {
          result.current.start();
        });
        t += 10 * MIN;
        act(() => {
          result.current.pause();
        });
        t += 60 * MIN; // paused time must not count
        act(() => {
          result.current.resume();
        });
        t += 5 * MIN;
        act(() => {
          result.current.skip();
        });

        expect(result.current.state.dailyTotals).toEqual({
          "2024-01-01": 15 * MIN,
        });
        expect(result.current.todayTotalMs).toBe(15 * MIN);
      } finally {
        vi.useRealTimers();
      }
    });

    it("credits a natural Focus Session in full and accumulates across sessions on the same day", () => {
      let t = new Date(2024, 0, 1, 9, 0).getTime();
      const clock = () => t;
      const storage = memoryStorage();
      vi.useFakeTimers();
      try {
        const { result } = renderHook(() =>
          usePomodoroTimer({ now: clock, storage }),
        );

        act(() => {
          result.current.start();
        });
        t += 5 * MIN;
        act(() => {
          result.current.skip(); // 5 min focus -> short break
        });
        act(() => {
          result.current.skip(); // skip break
        });
        act(() => {
          result.current.start();
        });
        t += 25 * MIN;
        act(() => {
          vi.advanceTimersByTime(25 * MIN + 500);
        });

        expect(result.current.state.dailyTotals["2024-01-01"]).toBe(30 * MIN);
      } finally {
        vi.useRealTimers();
      }
    });

    it("credits a Focus Session crossing local midnight entirely to the day it started", () => {
      let t = new Date(2024, 0, 1, 23, 50).getTime();
      const clock = () => t;
      const storage = memoryStorage();
      vi.useFakeTimers();
      try {
        const { result } = renderHook(() =>
          usePomodoroTimer({ now: clock, storage }),
        );

        act(() => {
          result.current.start();
        });
        t += 20 * MIN; // now 00:10 on Jan 2
        act(() => {
          result.current.skip();
        });

        expect(result.current.state.dailyTotals).toEqual({
          "2024-01-01": 20 * MIN,
        });
        expect(result.current.todayTotalMs).toBe(0);
      } finally {
        vi.useRealTimers();
      }
    });

    it("restores the state after a reload and keeps counting down from the stored absolute end time", () => {
      let t = new Date(2024, 0, 1, 10, 0).getTime();
      const clock = () => t;
      const storage = memoryStorage();

      const first = renderHook(() => usePomodoroTimer({ now: clock, storage }));
      act(() => {
        first.result.current.start();
      });
      t += 10 * MIN;
      first.unmount();

      const second = renderHook(() =>
        usePomodoroTimer({ now: clock, storage }),
      );

      expect(second.result.current.state.phase).toBe("focus");
      expect(second.result.current.state.status).toBe("running");
      expect(second.result.current.remainingMs).toBe(15 * MIN);
    });

    it("after a long absence, settles finished Phases in order and stops at the manual-start gate", () => {
      let t = new Date(2024, 0, 1, 10, 0).getTime();
      const clock = () => t;
      const storage = memoryStorage();

      const first = renderHook(() => usePomodoroTimer({ now: clock, storage }));
      act(() => {
        first.result.current.start();
      });
      first.unmount();

      t += 12 * 60 * MIN; // away overnight

      const second = renderHook(() =>
        usePomodoroTimer({ now: clock, storage }),
      );

      expect(second.result.current.state.phase).toBe("focus");
      expect(second.result.current.state.status).toBe("awaitingManualStart");
      expect(second.result.current.state.cycleCount).toBe(1);
      expect(second.result.current.state.dailyTotals).toEqual({
        "2024-01-01": 25 * MIN,
      });
      expect(second.result.current.remainingMs).toBeNull();
    });

    it("exposes the history as one entry per recorded day, newest first", () => {
      const storage = memoryStorage({
        "pomodoro-timer-state": JSON.stringify({
          state: {
            settings: {
              focusMin: 25,
              shortBreakMin: 5,
              longBreakMin: 15,
              cyclesBeforeLongBreak: 4,
            },
            phase: "focus",
            status: "awaitingManualStart",
            cycleCount: 0,
            dailyTotals: {
              "2024-01-03": 50 * MIN,
              "2023-12-31": 25 * MIN,
              "2024-01-01": 75 * MIN,
            },
          },
          phaseStartedAt: null,
          phaseEndAt: null,
          pausedRemainingMs: null,
        }),
      });

      const { result } = renderHook(() => usePomodoroTimer({ storage }));

      expect(result.current.history).toEqual([
        { day: "2024-01-03", totalMs: 50 * MIN },
        { day: "2024-01-01", totalMs: 75 * MIN },
        { day: "2023-12-31", totalMs: 25 * MIN },
      ]);
    });

    it("has an empty history before any Focus Session is recorded", () => {
      const { result } = renderHook(() =>
        usePomodoroTimer({ storage: memoryStorage() }),
      );

      expect(result.current.history).toEqual([]);
    });

    it("ignores corrupted stored data and starts fresh", () => {
      const storage = memoryStorage({ "pomodoro-timer-state": "{not json" });

      const { result } = renderHook(() => usePomodoroTimer({ storage }));

      expect(result.current.state.status).toBe("awaitingManualStart");
      expect(result.current.state.cycleCount).toBe(0);
    });
  });
});
