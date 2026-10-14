"use client";

import { useEffect, useRef, useState } from "react";
import {
  SETTINGS_BOUNDS,
  type PomodoroSettings,
} from "@/lib/pomodoro-timer";

const FIELDS: Array<{ key: keyof PomodoroSettings; label: string; unit: string }> =
  [
    { key: "focusMin", label: "Focus Session（專注）", unit: "分鐘" },
    { key: "shortBreakMin", label: "Short Break（短休息）", unit: "分鐘" },
    { key: "longBreakMin", label: "Long Break（長休息）", unit: "分鐘" },
    { key: "cyclesBeforeLongBreak", label: "幾個 Cycle 後長休息", unit: "個" },
  ];

function NumberField({
  id,
  label,
  unit,
  value,
  min,
  max,
  onCommit,
}: {
  id: string;
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
}) {
  // While typing, show the raw text so "1" -> "15" works; null means show the real value.
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={draft ?? String(value)}
          onChange={(event) => {
            setDraft(event.target.value);
            const parsed = event.target.valueAsNumber;
            if (Number.isFinite(parsed)) onCommit(parsed);
          }}
          onBlur={() => setDraft(null)}
          className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-right text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <span className="w-10 text-sm text-zinc-500 dark:text-zinc-400">
          {unit}
        </span>
      </span>
    </div>
  );
}

export function SettingsDialog({
  open,
  settings,
  onChange,
  onReset,
  onClose,
}: {
  open: boolean;
  settings: PomodoroSettings;
  onChange: (changes: Partial<PomodoroSettings>) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        // Clicking the backdrop (the dialog element itself) closes it.
        if (event.target === dialogRef.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-2xl bg-white p-6 text-left shadow-xl backdrop:bg-black/40 dark:bg-zinc-950"
    >
      <h2 className="mb-1 text-xl font-semibold text-black dark:text-zinc-50">
        設定 Settings
      </h2>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        變更會套用到下一個 Phase，進行中的不受影響。
      </p>
      <div className="flex flex-col gap-3">
        {FIELDS.map(({ key, label, unit }) => (
          <NumberField
            key={key}
            id={`setting-${key}`}
            label={label}
            unit={unit}
            value={settings[key]}
            min={SETTINGS_BOUNDS[key].min}
            max={SETTINGS_BOUNDS[key].max}
            onCommit={(value) => onChange({ [key]: value })}
          />
        ))}
      </div>
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-zinc-300 px-5 py-2 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          恢復預設值
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-foreground px-5 py-2 font-medium text-background"
        >
          完成
        </button>
      </div>
    </dialog>
  );
}
