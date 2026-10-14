import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePomodoroTimer } from "./pomodoro-timer";

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
});
