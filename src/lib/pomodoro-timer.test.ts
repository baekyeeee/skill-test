import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { DEFAULT_SETTINGS, usePomodoroTimer } from "./pomodoro-timer";

const FOCUS_DURATION_MS = DEFAULT_SETTINGS.focusMin * 60 * 1000;

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

  it("returns to awaiting manual start once the Focus Session naturally completes", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => usePomodoroTimer());

      act(() => {
        result.current.start();
      });
      act(() => {
        vi.advanceTimersByTime(FOCUS_DURATION_MS + 500);
      });

      expect(result.current.state.status).toBe("awaitingManualStart");
      expect(result.current.state.phase).toBe("focus");
      expect(result.current.remainingMs).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
