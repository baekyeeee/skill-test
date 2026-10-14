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

export default function Home() {
  const { state, remainingMs, start } = usePomodoroTimer();

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-6 px-16 py-32 text-center">
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
          {remainingMs !== null && (
            <p className="text-5xl font-mono font-semibold tabular-nums text-black dark:text-zinc-50">
              {formatRemaining(remainingMs)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={start}
          disabled={state.status !== "awaitingManualStart"}
          className="rounded-full bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-[#ccc]"
        >
          開始 Start
        </button>
      </main>
    </div>
  );
}
