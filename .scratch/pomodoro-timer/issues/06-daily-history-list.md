# 06: 歷史每日總表 UI

**What to build:** 首頁列出過去每一天的 Daily Focus Total(只有每天一個數字,沒有逐筆明細),不設保留天數上限,讓使用者能回顧自己的專注紀錄。

**Blocked by:** 05

**Status:** ready-for-agent

- [ ] 首頁有一個每日總表區塊,列出 `dailyTotals` 裡的每一天跟對應的總時數,依日期排序
- [ ] 沒有紀錄時顯示合理的空狀態文字
- [ ] 有測試覆蓋:多天資料時列表渲染正確(透過 `usePomodoroTimer` 的狀態,不直接操作 DOM 細節)
