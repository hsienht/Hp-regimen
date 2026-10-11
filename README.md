# 幽門桿菌治療服藥指南

供醫療人員編輯處方、產生服藥說明並列印／儲存 PDF 的靜態網頁工具。

## 使用網址與版本

- 正式網站：https://hsienht.github.io/Hp-regimen/
- 測試網站：https://hsienht.github.io/Hp-regimen-v3-test/
- 保留舊版：https://hsienht.github.io/Hp-regimen-v3-test/legacy/

正式 V3 已於 2026-10-06 發佈；本分支為後續 UI／帳號常用功能候選版，尚未更新正式網站。正式與測試網站使用不同 Supabase 專案。測試發佈須保留測試 repository 的 `js/config.js`，不可直接複製本機正式設定。

## 功能

- 藥物、劑量、服藥時間、囑言及單／兩階段療程編輯。
- 系統／個人組套分類選單與常用清單，個人操作與 Admin 管理分區。
- Supabase 登入、密碼重設、個人組套及 Admin 共用設定管理；資料庫 RLS 控制權限。
- 登入帳號的常用清單跨裝置載入並包含在 JSON v2 備份；可讀取舊 v1 備份。訪客常用清單留在此瀏覽器。
- JSON 合併／取代只影響目前帳號的個人組套；備份中的系統快照不會直接更新共用組套。
- 手機在編輯／預覽間切換，桌面維持左右排列；列印／PDF 顯示完整處方。

本次處方的修改只保留在目前頁面；按「儲存組套」才更新雲端組套。設定 JSON 不備份本次處方、診所欄位、密碼或帳號角色。重新整理前應儲存組套或列印所需處方。

## 檔案與建置

HTML／CSS／JavaScript 無需編譯。`js/defaults.js` 提供出廠內容，`storage.js` 保留舊版資料相容性，`app.js` 負責編輯／預覽，`cloud.js` 負責雲端操作，`transfer.js` 負責設定備份。`config.js` 僅包含專案 URL、publishable key 與重設密碼返回網址，不可使用 secret／service_role key。

SQL 操作見 [supabase/SETUP.md](supabase/SETUP.md)。001–007 已在測試與正式專案建置／驗證；常用及名稱唯一性所需 008／009 僅在測試專案完成，正式 migration 尚待授權。不要重跑既有一次性 migration。

## 自動化驗證

```sh
node --test tests/*.test.cjs
```

目前 48 項測試通過。GitHub Actions 的 `V3 regression` 在 push、pull request 或手動觸發時檢查 JavaScript 語法及全部 Node 回歸測試。此流程獨立於 Pages 發佈，不會自動阻擋 Pages 部署。

測試使用 VM／模擬 DOM 與 Supabase 回應；不等於真實瀏覽器、SQL 或 Email 驗證。已完成的真實操作及待辦見 [V3_RELEASE_CHECKLIST.md](V3_RELEASE_CHECKLIST.md)。
