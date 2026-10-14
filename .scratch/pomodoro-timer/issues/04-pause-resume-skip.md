# 04: 暫停/繼續 + 提早結束(Skip)

**What to build:** 使用者可以暫停、繼續目前正在倒數的 Phase(暫停期間不計時);也可以提早結束目前的 Phase——提早結束的 Focus Session 一樣要把「已經過的時間」算進 Cycle 計數,並照常轉換到下一個 Phase。

**Blocked by:** 03

**Status:** done

- [x] `usePomodoroTimer` 新增 `pause`/`resume`:暫停時剩餘時間固定不變,直到按下繼續才繼續倒數
- [x] `usePomodoroTimer` 新增 `skip`:提早結束目前 Phase,並照自然結束的規則轉換到下一個 Phase
- [x] 提早結束的 Focus Session 一樣會讓 Cycle 計數 +1(跟自然完成的規則相同)
- [x] 首頁有「暫停/繼續」「提早結束」按鈕,狀態對應正確地啟用/停用
- [x] 有測試覆蓋:暫停中前進時間不影響剩餘時間;提早結束後 Cycle 與下一個 Phase 轉換正確
