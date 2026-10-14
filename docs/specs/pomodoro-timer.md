## Problem Statement

The user wants a Pomodoro-style timer web app to structure work into Focus Sessions and Breaks, and to see how much they actually focused each day, without creating an account or relying on a backend.

## Solution

A single-page Next.js app, entirely client-side, that runs the classic Pomodoro cycle (Focus Session → Break, with a Long Break every Nth Cycle), supports pausing, resuming, and early-skipping a Phase, and tracks a Daily Focus Total per calendar day — all persisted in the browser via `localStorage`, with no login and no server.

## User Stories

1. As a Pomodoro user, I want to start a Focus Session, so that I can begin focused work with a visible countdown.
2. As a Pomodoro user, I want the Break to start automatically after a Focus Session ends, so that I don't have to remember to take a break.
3. As a Pomodoro user, I want to be the one who manually starts my next Focus Session, so that I'm not forced back into work before I'm ready.
4. As a Pomodoro user, I want to pause and resume a running Phase, so that I can handle an interruption without losing my progress.
5. As a Pomodoro user, I want to skip/early-end the current Phase, so that I can move on when I'm done early or interrupted for good.
6. As a Pomodoro user, I want time I've actually spent focusing to count toward today's total even if I stop a Focus Session early, so that my daily total reflects real effort, not just full Pomodoros.
7. As a Pomodoro user, I want an early-ended Focus Session to still count toward my Cycle progress, so that my Long Break still arrives on the expected rhythm.
8. As a Pomodoro user, I want to hear a sound when a Phase ends, so that I notice the transition without staring at the screen.
9. As a Pomodoro user, I want my running timer to survive a page reload or an accidentally closed tab, so that I don't lose my countdown.
10. As a Pomodoro user, I want Phases that finished while I was away (e.g. overnight) to be credited and advanced automatically, so that my history stays accurate.
11. As a Pomodoro user, I want the app to stop and wait for me at my next Focus Session even after a long absence, so that it doesn't silently track "focus" time while I'm not there.
12. As a Pomodoro user, I want a Focus Session that spans midnight to be attributed entirely to the day it started, so that my daily totals stay simple and predictable.
13. As a Pomodoro user, I want to see today's Daily Focus Total at a glance, so that I know how productive today has been.
14. As a Pomodoro user, I want to see a list of my Daily Focus Totals from previous days, so that I can track my focus habit over time.
15. As a Pomodoro user, I want to see which Cycle I'm on (e.g. "2 / 4"), so that I know how close I am to my next Long Break.
16. As a Pomodoro user, I want to adjust the Focus/Short Break/Long Break durations, so that I can tune the rhythm to my own preference.
17. As a Pomodoro user, I want to adjust how many Cycles happen before a Long Break, so that I can control how often I get a longer rest.
18. As a Pomodoro user, I want invalid settings values to be rejected or clamped, so that I can't accidentally configure a broken timer.
19. As a Pomodoro user, I want a "reset to defaults" option in Settings, so that I can quickly undo my customizations.
20. As a Pomodoro user, I want to use the whole app without creating an account or logging in, so that I can start immediately.
21. As a Pomodoro user, I want my data to persist across browser sessions on the same browser, so that I don't lose my history when I close the tab.
22. As a Pomodoro user, I want everything on one page (timer, history, settings), so that I don't have to navigate between multiple screens to use a simple tool.

## Implementation Decisions

- Single-page Next.js (App Router) Client Component (`"use client"`); no server data, no login, no backend — consistent with [ADR 0001](../adr/0001-client-only-storage-no-accounts.md).
- All state (settings, running Phase, Daily Focus Totals) is persisted in `localStorage`.
- **Single test seam**: a `usePomodoroTimer` hook owns the state machine, an injectable clock, and `localStorage` read/write. UI components (countdown display, controls, Cycle indicator, history list, Settings drawer) are a thin display layer over this hook with no independent logic of their own to test.
- The hook's internal model is the reducer validated in the logic prototype (`src/app/pomodoro-state.prototype.html`). Inlined here because the shape is more precise in code than in prose:

  ```
  State:
    settings: { focusMin, shortBreakMin, longBreakMin, cyclesBeforeLongBreak }
    phase: 'focus' | 'shortBreak' | 'longBreak'
    status: 'awaitingManualStart' | 'running' | 'paused'
    cycleCount: number
    phaseStartedAt: timestamp | null
    phaseEndAt: timestamp | null        // absolute target end time — this is what survives reload
    pausedRemainingMs: number | null
    dailyTotals: { [isoDateString]: elapsedMs }   // keyed by local calendar day of phaseStartedAt

  Actions: START | PAUSE | RESUME | SKIP | ADVANCE_TIME(ms)
  ```

  - `START` only legal when `status === 'awaitingManualStart'`.
  - Breaks (`shortBreak`/`longBreak`) always auto-start on the prior Phase's completion; `focus` always requires a manual `START`.
  - `SKIP`, or natural completion, of a `focus` Phase credits elapsed (or full) duration to `dailyTotals[dayKey(phaseStartedAt)]`, and always increments `cycleCount`, whether it completed naturally or was skipped early.
  - Reaching `cyclesBeforeLongBreak` triggers a `longBreak` instead of a `shortBreak`; completing a `longBreak` resets `cycleCount` to 0.
  - Reload/long-absence handling: because `phaseEndAt` is an absolute timestamp, elapsed real time (including time while the tab was closed) is reconciled the next time "now" is computed — any number of auto-starting Phases complete in sequence, but this stops as soon as it reaches an `awaitingManualStart` gate (i.e. the next `focus`), even if more time has already elapsed. Validated in the prototype's "闔上筆電過一夜" scenario.
  - Day attribution uses the local calendar day of `phaseStartedAt`, not of completion — validated in the prototype's "跨過午夜" scenario, so a Focus Session crossing midnight is credited entirely to the day it began.
- Settings: four adjustable numeric fields (Focus/Short Break/Long Break minutes, Cycles-before-Long-Break), clamped to sane bounds (e.g. 1–180 minutes, 1–12 cycles), plus a reset-to-defaults action. Presented in a drawer/modal, not a separate route.
- History: stores one Daily Focus Total number per calendar day only — no per-session log — retained indefinitely.
- Notification: a built-in short sound/chime plays on every Phase end. Browser `Notification` API is explicitly out of scope (see below).
- Visual style: single light theme; no dark mode toggle.
- Page layout: one route holds the countdown + Phase name + Start/Pause/Resume/Skip controls, Cycle progress indicator, today's Daily Focus Total, the daily history list, and a Settings entry point.

## Testing Decisions

- A good test here exercises `usePomodoroTimer` only through its public surface (returned state + action dispatchers) via `renderHook`, asserting on observable fields (phase, status, remaining time, cycleCount, dailyTotals) — never on internal reducer branches or rendered markup.
- Clock and storage are injected into the hook (a `now()` provider and a storage adapter) so tests control simulated time deterministically instead of waiting in real time or globally faking `Date.now()`.
- No component-level or end-to-end tests for this spec: the hook is the one seam with product-relevant branching logic; the surrounding JSX is thin and low-risk.
- Prior art: none yet — this is a greenfield project with no test framework configured in `package.json`. This spec is also the first to introduce one; pick whichever of Vitest/Jest + React Testing Library's `renderHook` the team prefers.
- Scenarios to cover mirror the prototype's guided walkthroughs: a full Cycle happy path, early-skip crediting partial time, pause not accruing elapsed time, a long-absence cascade stopping at the manual-start gate, and a Focus Session crossing midnight.

## Out of Scope

- User accounts, login, or any backend/cross-device sync (see [ADR 0001](../adr/0001-client-only-storage-no-accounts.md)).
- Browser `Notification` API / permission-based system notifications — v1 ships sound-only.
- Dark mode / theme switching.
- Per-session history detail (start/end timestamps of individual Focus Sessions) — only daily totals are kept.
- Any data export/import or backup mechanism.
- Multi-page routing (`/timer`, `/history`, `/settings` as separate routes) — everything lives on one page.

## Further Notes

- Terminology is defined in [GLOSSARY.md](../../GLOSSARY.md) (Focus Session, Break, Short Break, Long Break, Cycle, Phase, Daily Focus Total) — use these terms verbatim in code, UI copy, and tests.
- A throwaway logic prototype validating the state machine lives at `src/app/pomodoro-state.prototype.html`. Per the Prototype skill, once the real `usePomodoroTimer` module is implemented, commit the prototype to a throwaway branch (out of main) and leave a pointer to that branch on this issue.
- `gh` CLI / a git remote were not available in this environment when this spec was prepared, so it has not yet been published as a GitHub issue. Publish it manually once tracker access is set up, applying the `ready-for-agent` label.
