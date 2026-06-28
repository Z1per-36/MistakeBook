# MistakeBook (AI 錯題本)

MistakeBook 是一款由 AI 驅動的智慧錯題本 App，專為學生與考生設計。它結合了原生的文件掃描器與強大的 Google Gemini API，能夠自動將實體錯題數位化，並提供最精準的 AI 解答與後續問答討論。

## 📥 下載與安裝 (Download)

👉 **[點擊這裡前往 Releases 頁面下載最新版 APK 安裝檔](../../releases/latest)** 

*(下載後請在 Android 手機上直接開啟並允許安裝未知來源應用程式)*

## 🌟 核心特色 (Features)

- **智慧文件掃描 (Smart Document Scanner)**
  - 內建原生掃描器。
  - 支援自動邊緣偵測、視角攤平以及去除陰影，確保錯題圖片清晰無比。
- **AI 雙重查證機制 (2-Pass Verification)**
  - 整合 Google Gemini 3.5 Flash 視覺大模型。
  - 第一階段：精確萃取題目與解答。
  - 第二階段：嚴格審查員模式，自動揪出 OCR 錯字與邏輯謬誤，給出完美解答。
- **自訂筆跡規則 (Color Rules)**
  - 可自訂對於特定科目或特定筆跡顏色的動作（例如看到紅筆代表正確答案）。
- **互動式 AI 討論 (Interactive AI Tutor)**
  - 不滿意解答或有疑問？隨時進入對話模式與 AI 家教討論。
  - AI 有能力透過工具呼叫自動修正並更新資料庫內的錯題解答。
- **本地端儲存 (Local SQLite Storage)**
  - 透過 Expo SDK 54 原生的 SQLiteProvider，穩定且快速地儲存所有錯題。
  - 支援匯出為 PDF 或 Word。

## 🛠 技術棧 (Tech Stack)

- **前端框架**: React Native (Expo SDK 54)
- **導航**: React Navigation v7
- **資料庫**: Expo SQLite
- **AI 核心**: Google GenAI SDK (`@google/genai`)
- **UI 與渲染**: React Native Markdown Display, 原生樣式 (Card Design)
- **硬體功能**: React Native Document Scanner Plugin

## 🚀 快速開始 (Quick Start)

### 1. 安裝依賴
```bash
npm install
```

### 2. 環境變數設定
請在專案根目錄建立一個 `.env` 檔案，並放入您的 Gemini API Key：
```
EXPO_PUBLIC_GEMINI_API_KEY=你的_GEMINI_API_KEY
```

### 3. 啟動開發伺服器
```bash
npx expo start -c
```
*(備註：由於本專案使用了原生掃描器套件，無法直接在一般的 Expo Go 中執行。您必須使用 EAS 進行 Development Build 或打包為獨立 APK)*

## 📦 打包與發布 (Build)

如果您想要編譯出可以獨立安裝的 Android APK：

1. 登入 Expo EAS：
```bash
eas login
```
2. 啟動 Preview Profile 編譯：
```bash
eas build --profile preview --platform android
```

---
*Developed with AI IDE.*
