"use client";

import {
  PHASE_LABEL,
  STATUS_LABEL,
  usePomodoroTimer,
} from "@/lib/pomodoro-timer";

function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const BUTTON_CLASS =
  "min-w-40 whitespace-nowrap rounded-full bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]";

export default function Home() {
  const { state, remainingMs, start, pause, resume, skip } =
    usePomodoroTimer();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-6 px-8 py-32 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Pomodoro Timer
        </h1>
        <div className="flex flex-col gap-2">
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            目前 Phase：{PHASE_LABEL[state.phase]}
          </p>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            狀態：{STATUS_LABEL[state.status]}
          </p>
          <p className="text-lg text-zinc-700 dark:text-zinc-300">
            Cycle：{state.cycleCount} / {state.settings.cyclesBeforeLongBreak}
          </p>
          <p className="h-14 text-5xl font-mono font-semibold tabular-nums text-black dark:text-zinc-50">
            {remainingMs !== null ? formatRemaining(remainingMs) : null}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={state.status !== "awaitingManualStart"}
            className={BUTTON_CLASS}
          >
            開始 Start
          </button>
          {state.status === "paused" ? (
            <button type="button" onClick={resume} className={BUTTON_CLASS}>
              繼續 Resume
            </button>
          ) : (
            <button
              type="button"
              onClick={pause}
              disabled={state.status !== "running"}
              className={BUTTON_CLASS}
            >
              暫停 Pause
            </button>
          )}
          <button
            type="button"
            onClick={skip}
            disabled={state.status === "awaitingManualStart"}
            className={BUTTON_CLASS}
          >
            提早結束 Skip
          </button>
        </div>
      </main>
    </div>
  );
}
