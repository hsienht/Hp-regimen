# V3.0B 建置與驗證

此分支預設關閉雲端，原本的本機操作仍可使用。尚未部署。

1. 建立 Supabase 專案，在 SQL Editor 依序執行 `001_schema.sql`、`002_seed.sql`。Schema 為一次性 migration；不要重複執行。Seed 可重複執行，不覆蓋既有雲端修改。
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

Admin 藥品管理 UI、系統組套刪除 UI、舊資料明確匯入流程、JSON 備份／還原、完整帳號狀態恢復與密碼重設 UI、真實 Supabase 與瀏覽器測試。舊版管理按鈕在雲端模式會提示改用雲端儲存，不會寫入共用資料。

目前 Node 測試驗證資料白名單、預設劑量、本機相容性與模擬 DOM 啟動，不等於真實資料庫或瀏覽器驗證。SDK/API 依 Supabase 官方文件：
- https://supabase.com/docs/reference/javascript/initializing
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
