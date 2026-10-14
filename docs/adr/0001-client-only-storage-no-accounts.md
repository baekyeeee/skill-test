# Client-only storage, no accounts or backend

All Pomodoro timer state (settings, running Phase, Daily Focus Totals) lives in the browser's `localStorage`. There is no server, no login, and no cross-device sync. We chose this for simplicity and privacy, accepting that clearing browser data or switching browsers/devices loses all history, and that adding sync later means migrating from a local-only model.
