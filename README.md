# 幽門桿菌治療服藥指南

一個用於顯示幽門桿菌（H. pylori）治療處方的互動式網頁工具，方便醫療人員快速產生清晰的服藥說明表格。

## 功能

- 內建多種常見處方組套（鉍劑四合一、序列療法、PCAB處方等）
- 支援自訂組合與藥物劑量設定
- 自動產生服藥時間表（含藥錠圖示）
- 支援兩階段療程
- 藥品副作用及注意事項

## 使用方式

直接開啟以下網址即可使用，無需安裝：

👉 https://hsienht.github.io/Hp-regimen/

## 技術

純靜態 HTML/CSS/JavaScript，使用 localStorage 儲存自訂設定，無需後端伺服器。

## V3.0A 資料層

- `css/app.css`：原有樣式。
- `js/defaults.js`：出廠藥品、組套與介面常數。
- `js/storage.js`：可替換儲存 adapter、舊版資料載入與 migration。
- `js/app.js`：原有處方編輯、管理與列印介面。

依上述順序載入傳統 script，保留 HTML inline handlers 的相容性。V3.0A 階段尚未加入 Supabase、登入或雲端同步；現有管理功能仍儲存在本機。既有 `hp_drugs_v4` / `hp_presets_v7` 不覆蓋；首次使用或恢復預設才會載入新版出廠內容。Tetracycline 250mg 加在既有 500mg 後，保持 subtype 索引相容。

驗證：`node --test tests/data-layer.test.cjs`。


## V3.0B 雲端基礎（尚未啟用）

`js/config.js` 預設留空，因此本機模式保持可用。填入公開專案連線設定後啟用 `js/cloud.js` 的登入、系統／個人組套與公開快取。資料庫 schema、seed、RLS 驗證與未完成項目見 [supabase/SETUP.md](supabase/SETUP.md)。

執行全部本機測試：`node --test tests/*.test.cjs`。真實 Supabase 與瀏覽器驗證尚未完成。

### 管理與備份更新

已加入 Admin 藥品管理、設定 JSON 備份／個人組套合併或取代匯入、此瀏覽器舊版設定匯入。需追加 `supabase/004_management.sql`；`005_verify_management.sql` 用於驗證交易回滾、規格保護及匯入版本衝突。所有資料庫脚本仍需在真實專案驗證。


### 系統組套排序／刪除及密碼流程

已加入 Admin 系統組套排序與刪除、訪客忘記密碼、Email 連結回到的新密碼表單，以及登入後變更密碼。需追加 `supabase/006_system_management.sql`，並設定 `resetRedirectUrl` 與 Supabase Auth 的 URL Configuration；詳見 SETUP。尚未執行真實 Email／SQL／瀏覽器驗證。
