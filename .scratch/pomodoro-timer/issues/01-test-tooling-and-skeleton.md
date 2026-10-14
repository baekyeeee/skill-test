# 01: 測試工具 + usePomodoroTimer 骨架

**What to build:** 專案目前沒有任何測試框架。裝好 Vitest + React Testing Library,建立 `usePomodoroTimer` hook 的骨架(先回傳固定的預設初始狀態,還沒有任何 Phase 轉換邏輯),並讓首頁讀取、顯示這個狀態,讓後續每張票都能在同一個 seam 上直接寫測試、直接接 UI。

**Blocked by:** None(可以馬上開始)

**Status:** ready-for-agent

- [ ] `npm run test` 能跑 Vitest
- [ ] 可以用 `@testing-library/react` 的 `renderHook` 測試 hook
- [ ] `usePomodoroTimer()` 回傳預設初始狀態:phase 為 Focus Session、status 為等待手動開始、cycleCount 為 0(cyclesBeforeLongBreak 預設 4)、dailyTotals 為空,且有對應測試
- [ ] 首頁可以正常渲染,畫面上看得到目前 Phase 與狀態的文字(先不用能互動)
