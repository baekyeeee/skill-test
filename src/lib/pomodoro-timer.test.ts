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
});
