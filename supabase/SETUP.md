# V3.0B 建置與驗證

此分支預設關閉雲端，原本的本機操作仍可使用。尚未部署。

1. 建立 Supabase 專案，在 SQL Editor 依序執行 `001_schema.sql`、`002_seed.sql`、`004_management.sql`。Schema 為一次性 migration；不要重複執行。Seed 可重複執行，不覆蓋既有雲端修改。
2. Auth 設定關閉公開註冊，於 Dashboard 手動建立使用者。第一個管理者建立後，在 SQL Editor 執行：
   ```sql
   update public.profiles set role='admin',display_name='Hsiao'
   where id=(select id from auth.users where email='你的管理者 Email');
   ```
3. 在 `js/config.js` 填入專案 URL 與 publishable key（或 legacy anon key）。不可使用 secret / service_role key。設定開啟後將從雲端讀取資料，不會把舊 localStorage 自動上傳。
4. 在 SQL Editor 執行 `003_verify_rls.sql`。腳本檢查訪客唯讀、跨帳號隔離、自行升權禁止、Admin 修改與版本遞增，最後 rollback。此腳本尚未在真實 Supabase 執行。
5. 在測試網站驗證 Guest 可直接使用組套；登入 A/B 帳號，各自建立組套且互不可見；Admin 更新系統組套，另一台電腦重新載入後取得新版；離線使用共用快取；刪除個人組套；同一組套兩個視窗更新時後儲存者收到版本衝突。

## 實作範圍

- Email/password 登入、登出、個人組套新增／更新／刪除、Admin 系統組套新增／更新。
- RLS 在資料庫強制執行，profiles 不允許瀏覽器改 role。
- 公開快取以 Supabase URL 區分，個人組套不持久寫入快取。登入狀態放在 sessionStorage（關閉分頁後需重新登入）；不保存密碼。
- SDK 僅在已填連線設定時從固定版本 CDN 載入。離線可使用公開快取或出廠資料；雲端写入沒有離線佇列。
- 保存模板時採欄位白名單，不傳送 clinicName、額外病人欄位、UI uid 或整個 R。自由文字仍由使用者負責只填組套設定。
- 存檔使用 version 條件，若另一人已修改，拒絕覆蓋。
- 背景更新保留本次處方並以藥品規格文字重新對應索引；遇到移除規格則保留原資料並要求完成處方後重新整理。

## 尚待後續階段

系統組套刪除／排序 UI、完整密碼重設 UI、真實 Supabase 與瀏覽器測試。雲端模式的組套儲存使用明確的個人／系統按鈕，舊本機組套管理被封鎖，避免誤認為已同步。Admin 藥品管理與備份／匯入說明見下方更新。

目前 Node 測試驗證資料白名單、預設劑量、本機相容性與模擬 DOM 啟動，不等於真實資料庫或瀏覽器驗證。SDK/API 依 Supabase 官方文件：
- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security

## 管理功能更新

追加執行 `004_management.sql`（一次性 migration）。提供兩個交易式 RPC：Admin 藥品更新，以及個人組套合併／取代匯入。每次匯入檢查整個個人組套庫版本；藥品更新逐筆檢查版本，任何錯誤整筆回滾。所有個人寫入會取得同帳號的交易鎖，以防匯入與新增組套同時發生。

- Admin 可從原有藥品管理介面新增藥品、增加規格、修改名稱／圖示／特殊囑言。既有藥品不可刪除、既有規格不可刪除／改名／重新排序，資料庫 trigger 也強制保護。
- 設定備份包含個人組套與藥品檔；Admin 備份另包含系統組套快照。備份不包含登入憑證、帳號角色、診所欄位或本次處方。
- 匯入的「合併」保留目前同名個人組套，只加入不同名組套。「取代」刪除目前帳號的個人組套後匯入；不修改其他帳號或系統組套。兩者皆先顯示数量與確認。
- 勾選「也將備份中的系統組套加入我的組套」可將系統快照還原為個人副本。共用系統組套仍需 Admin 明確更新，沒有整批系統取代功能。
- Admin 可由備份更新共用藥品檔；保留既有規格的索引、追加缺少規格，再套用備份名稱／圖示／囑言。
- 舊版匯入只讀取此瀏覽器 `hp_presets_v7` / `hp_drugs_v4`，以合併方式存為登入帳號的個人組套。舊鍵不刪除、不覆蓋，也不自動發布成共用組套。若舊檔有雲端未提供的藥品規格，先停止並要求管理者補齊。
- 單次檔案上限 2 MB，單次組套上限 100 個。匯入依藥品規格文字對應，避免來源與目的端的 subtype 索引不同而錯置。

後續仍需真實 Supabase / SQL 權限與瀏覽器驗證，以及完整密碼重設、系統組套刪除與排序介面。
