import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_SETTINGS, usePomodoroTimer } from "./pomodoro-timer";

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
});
