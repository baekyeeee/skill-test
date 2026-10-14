# 05: Daily Focus Total + 離線/跨午夜的正確性

**What to build:** 每次 Focus Session(含提早結束的)結束時,把經過的時間算進「開始那一天」的 Daily Focus Total,並把整個計時器狀態存進 localStorage。涵蓋兩個邊角情況:(a) 重新整理/重開分頁後,能從存檔的絕對結束時間接續倒數,就算離開很久、好幾個 Phase 都已經跑完,也會照順序自動推進,直到卡在下一次 Focus Session 的「等待手動開始」才停下來;(b) 跨過午夜的 Focus Session 整段算在開始的那一天,不拆成兩天。

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Focus Session 結束(自然或提早結束)時,把經過時間累加進 `dailyTotals[開始那天]`
- [ ] 計時器狀態(Phase、狀態、Cycle 計數、絕對結束時間、Daily Focus Totals)存進 `localStorage`,重新整理頁面後能還原
- [ ] 重新整理時,若存檔的絕對結束時間早就已經過了,依序把已經完成的 Phase 結算、推進,直到遇到「等待手動開始」才停止,不會無限自動跑下去
- [ ] 一次 Focus Session 跨過本地時區的午夜,整段時間都算在開始的那一天
- [ ] 首頁顯示「今日」的 Daily Focus Total
- [ ] 有測試覆蓋:提早結束的部分計時、長時間離線後重建狀態、跨午夜歸屬三種情境(可直接參考 prototype 的對應情境)
