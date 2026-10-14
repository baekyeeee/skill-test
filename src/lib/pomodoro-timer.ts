import { useState } from "react";

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

const DEFAULT_SETTINGS: PomodoroSettings = {
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

export function usePomodoroTimer() {
  const [state] = useState<PomodoroState>(initialState);
  return { state };
}
