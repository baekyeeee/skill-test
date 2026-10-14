# Issue tracker: Local markdown

Issues and specs for this repo live as markdown files under `.scratch/`. No `gh` CLI or remote is needed; read and write the files directly.

## Layout

- One folder per feature: `.scratch/<feature>/`
- Tickets: `.scratch/<feature>/issues/NN-<slug>.md` (NN = zero-padded order, e.g. `02-single-focus-session-countdown.md`)
- The ticket number is NN (`01`, `02`, ...). `#2` / "ticket 2" means `02-*.md` in the relevant feature folder.

## Ticket format

```
# NN: <title>

**What to build:** ...

**Blocked by:** None | NN, NN

**Status:** <triage label or `done`>

- [ ] acceptance criterion
```

## Conventions

- **Create an issue**: add a new `NN-<slug>.md` with the next free number.
- **Read an issue**: read the file. If the reference is ambiguous, list `.scratch/*/issues/` and ask.
- **List issues**: `ls .scratch/*/issues/`, then grep `**Status:**` to filter.
- **Apply / remove a label**: edit the `**Status:**` line (labels are in `triage-labels.md`).
- **Comment**: append a `## Comments` section at the bottom of the file, one bullet per comment.
- **Close**: set `**Status:** done`, tick the completed checkboxes, and add a closing comment.
- **Sub-issues**: tickets of a feature are siblings in the same folder; the spec in `docs/specs/` is the parent.
- **Blocking**: the `**Blocked by:**` line. A ticket is unblocked when every listed ticket has `**Status:** done`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a new ticket file as above.

## When a skill says "fetch the relevant ticket"

Read the ticket file as above.

## Wayfinding operations

Used by `/wayfinder`. The **map** is `.scratch/<feature>/map.md` (Notes / Decisions-so-far / Fog); **child** tickets are the files in `.scratch/<feature>/issues/`.

- **Child ticket type**: a `**Type:** research|prototype|grilling|task` line under the title.
- **Frontier query**: open tickets (Status not `done`) whose `Blocked by` tickets are all `done` and that have no `**Assignee:**` line; lowest NN first.
- **Claim**: add `**Assignee:** @me` as the session's first write.
- **Resolve**: append the answer under `## Comments`, set `**Status:** done`, then append a pointer to the map's Decisions-so-far.
