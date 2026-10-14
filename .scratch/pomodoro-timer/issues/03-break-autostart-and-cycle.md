# 03: Break 自動開始 + Cycle / Long Break 節奏

**What to build:** Focus Session 自然結束後,自動進入 Short Break 並開始倒數;累積到設定的 Cycle 數之後,改進入 Long Break;Long Break 結束後 Cycle 計數歸零;不論哪一種 Break 結束,下一次 Focus Session 都要使用者手動開始。畫面上看得到目前是第幾個 Cycle。

**Blocked by:** 02

**Status:** done

- [x] Focus Session 自然結束時,Cycle 計數 +1,並自動開始下一個 Break(未達門檻進 Short Break,達到門檻進 Long Break)
- [x] Short Break / Long Break 結束後一律回到「等待手動開始」的 Focus Session,不會自動開始
- [x] Long Break 結束後 Cycle 計數歸零
- [x] 首頁顯示目前 Cycle 進度(例如「2 / 4」)
- [x] 有測試覆蓋:連續跑完一輪 Cycle(含 Long Break 觸發與重置)的完整路徑
