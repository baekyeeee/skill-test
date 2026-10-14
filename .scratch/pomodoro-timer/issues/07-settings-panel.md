# 07: 設定面板(可調整時長與 Cycle 數)

**What to build:** 使用者可以在設定抽屜/彈窗調整 Focus Session / Short Break / Long Break 的分鐘數,以及「幾個 Cycle 後進 Long Break」,數值會被限制在合理範圍內,並提供「恢復預設值」。

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] `usePomodoroTimer` 新增可以更新 `settings` 的動作,更新後下一個 Phase 套用新設定
- [ ] 數值超出合理範圍(例如 1–180 分鐘、1–12 個 Cycle)時會被拒絕或夾在邊界內
- [ ] 有「恢復預設值」可以一鍵還原成 25/5/15/4
- [ ] 首頁有設定用的抽屜/彈窗 UI,可以開關並調整上述欄位
- [ ] 有測試覆蓋:合法變更生效、超出邊界被夾住、恢復預設值
