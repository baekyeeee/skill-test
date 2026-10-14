# Pomodoro Timer

A browser-only Pomodoro timer: countdown through focus/break phases and track how much focus time accumulates per day. No account, no server; all state lives in the browser.

## Language

**Focus Session**:
A timer phase during which the user works, lasting a configurable duration (default 25 min).
_Avoid_: Work session, Pomodoro (reserve "Pomodoro" for the technique name, not an instance of a session)

**Break**:
A timer phase that follows a Focus Session, during which the user rests. Comes in two kinds: Short Break and Long Break.
_Avoid_: Rest, Pause (Pause is a distinct control action, not a phase type)

**Short Break**:
The default Break taken after a Focus Session (default 5 min).

**Long Break**:
A longer Break (default 15 min) taken after a configurable number of completed Focus Sessions (default every 4th).

**Cycle**:
One Focus Session plus the Break that follows it. The cycle count resets to zero after a Long Break and determines when the next Long Break is due.

**Phase**:
The umbrella term for "whichever of Focus Session, Short Break, or Long Break is currently running."
_Avoid_: Stage, Mode

**Daily Focus Total**:
The sum of elapsed time across all Focus Sessions (including ones stopped early) attributed to a single calendar day, bounded by local midnight-to-midnight.
_Avoid_: Daily record, today's time
