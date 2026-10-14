---
title: Matt Pocock Skills 安裝與使用指南
tags: Claude Code, Skills, 教學
description: mattpocock/skills 的安裝方式與各 skill 功能說明
---

# Matt Pocock Skills 安裝與使用指南

> 來源：https://github.com/mattpocock/skills
> 適用工具：Claude Code

[TOC]

## 一、安裝

安裝方式有兩種，**擇一即可**，兩個都裝會讓每個 skill 重複出現。

### 方式 A：Claude Code plugin

會自動更新，不需要手動維護。

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

### 方式 B：用 `npx skills` 複製到專案內

檔案會放進專案，可以自己修改內容，但更新要手動做。

```bash
npx skills@latest add mattpocock/skills -a claude-code
```

安裝時注意：

1. 選 skills 時用空白鍵勾選，**務必勾選 `setup-matt-pocock-skills`**，Enter 確認。
2. 出現 Installation scope 時：

| 選項 | 安裝位置 | 效果 |
|---|---|---|
| **Project** | 目前資料夾內（`.claude/skills/`） | 只有此專案能用，檔案會跟著專案 commit |
| **Global** | 家目錄（`~/.claude/skills/`） | 所有專案都能用，只有自己有，不進專案 git |

想裝進專案就選 **Project**。

### 前置條件

- 方式 B 需要 Node.js（`node -v` 有版本號即可）。
- 需要已安裝 Claude Code（`claude --version` 確認）。
- 要在**專案資料夾**的終端機內執行（先 `cd` 到專案，用 `pwd` 確認）。

### 確認安裝成功

```bash
ls .claude/skills
```

> [!NOTE]
> 若同時裝了全域與專案內兩份，skill 可能會重複出現。更新用 `npx skills@latest update`。

## 二、安裝後的初始設定

在專案資料夾啟動 Claude Code：

```bash
claude
```

執行一次（**每個專案做一次**）：

```
/setup-matt-pocock-skills
```

它會問三件事：

1. 用哪種 issue tracker（GitHub、GitLab、本地檔案等）
2. triage 時要用哪些標籤
3. 產生的文件要存在哪裡

## 三、各 Skill 功能說明

用 `/名稱` 呼叫。

### 起手式

| Skill | 用途 |
|---|---|
| `setup-matt-pocock-skills` | 每個專案先跑一次。設定 issue tracker、triage 標籤、文件存放位置，其他工程類 skill 依此運作。 |
| `ask-matt` | 不知道該用哪個 skill 時問它，會推薦適合的 skill 或流程。 |

### 釐清想法（先想清楚再動手）

| Skill | 用途 |
|---|---|
| `grill-me` | 讓 AI 對計畫或設計不斷追問，找出沒想清楚的地方。不限寫程式。 |
| `grill-with-docs` | 同上，並在過程中建立專案術語表與決策紀錄（ADR）。 |
| `grilling` | `grill-me` 的底層邏輯，說「幫我挑戰這個想法」時也會觸發。 |
| `to-questionnaire` | 自己答不出來的決定，整理成問卷給別人填。 |
| `domain-modeling` | 建立或修改專案術語表（GLOSSARY.md）與決策紀錄。 |
| `prototype` | 做用完即丟的原型，驗證狀態邏輯或 UI 感覺。 |
| `research` | 查可靠的官方來源，把結果整理成 Markdown 存進專案。 |

### 實作

| Skill | 用途 |
|---|---|
| `implement` | 根據規格或一組 ticket 去實作。 |
| `implement-spec` | 實作 `/to-spec` 與 `/to-tickets` 產出的內容。 |
| `tdd` | 測試驅動開發：先寫失敗的測試，再寫程式，再重構。 |
| `diagnosing-bugs` | 遇到壞掉、報錯、變慢時，有步驟地診斷。 |

### 程式碼架構

| Skill | 用途 |
|---|---|
| `codebase-design` | 設計「深模組」的共用詞彙：介面簡單、內部複雜，易測試、易讀。 |
| `improve-codebase-architecture` | 掃描專案找出可改善的架構，產生 HTML 報告，再深入討論所選項目。 |
| `setup-ts-deep-modules` | 在 TypeScript 專案裝 dependency-cruiser，強制 package 只能從入口檔存取。 |

### 專案管理與交接

| Skill | 用途 |
|---|---|
| `triage` | 整理 issue 與外部 PR：分類、驗證、必要時追問，寫成 AI 可直接執行的任務說明。 |
| `handoff` | 把目前對話濃縮成交接文件，讓另一個 AI 接手。 |
| `retro` | 回顧這次寫程式的過程。 |
| `pr` | 協助撰寫 PR 描述。 |
| `loop-me` | 針對想建立的工作流程做追問，釐清規格。 |
| `teach` | 教你一個新技能或概念。 |

### 工具設定

| Skill | 用途 |
|---|---|
| `setup-pre-commit` | 設定 Husky 提交前檢查：Prettier 格式化、型別檢查、測試。 |
| `git-guardrails-claude-code` | 設定 hook，擋下危險 git 指令（push、reset --hard 等）。 |
| `writing-for-agents` | 撰寫給 AI 讀的文件（skill、CLAUDE.md）的寫作準則。 |

### 特定用途（多半用不到）

| Skill | 用途 |
|---|---|
| `migrate-to-shoehorn` | 把測試裡的 `as` 型別斷言換成 shoehorn 函式庫。 |
| `scaffold-exercises` | 建立課程練習題的目錄結構。 |
| `wizard` | 產生互動式 bash 腳本，帶人類逐步完成只有人能做的事。 |

> [!WARNING]
> `synced` 未讀到說明，用途不確定，故未列入。`ask-matt`、`to-questionnaire` 依說明文字整理，未實際執行驗證。

## 四、新手建議流程

1. `/setup-matt-pocock-skills`：初始設定
2. `/grill-me`：說說想做什麼，讓 AI 追問
3. `/tdd` 或 `/implement`：想清楚後開始實作

其他 skill 等遇到對應情境再用即可。
