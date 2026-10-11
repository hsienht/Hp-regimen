# V3.0B 建置與驗證

正式 V3 已於 2026-10-06 發佈。此文件包含新專案建置步驟及後續 migration；既有正式／測試專案不要重跑已完成的一次性腳本。本機 config 目前為正式設定，測試發佈保留測試 repository 的設定。

1. 建立 Supabase 專案，在 SQL Editor 依序執行 `001_schema.sql`、`002_seed.sql`、`004_management.sql`、`006_system_management.sql`。Schema 為一次性 migration；不要重複執行。Seed 可重複執行，不覆蓋既有雲端修改。
2. Auth 設定關閉公開註冊，於 Dashboard 手動建立使用者。第一個管理者建立後，在 SQL Editor 執行：
   ```sql
   update public.profiles set role='admin',display_name='Hsiao'
   where id=(select id from auth.users where email='你的管理者 Email');
   ```
3. 在 `js/config.js` 填入專案 URL 與 publishable key（或 legacy anon key）。不可使用 secret / service_role key。設定開啟後將從雲端讀取資料，不會把舊 localStorage 自動上傳。
4. 在 SQL Editor 執行 `003_verify_rls.sql`。腳本檢查訪客唯讀、跨帳號隔離、自行升權禁止、Admin 修改與版本遞增，最後 rollback。003 已由使用者在測試與正式專案執行並回報無錯誤。
5. 在測試網站驗證 Guest 可直接使用組套；登入 A/B 帳號，各自建立組套且互不可見；Admin 更新系統組套，另一台電腦重新載入後取得新版；離線使用共用快取；刪除個人組套；同一組套兩個視窗更新時後儲存者收到版本衝突。

## 實作範圍

- Email/password 登入、登出、個人組套新增／更新／刪除、Admin 系統組套新增／更新。
- RLS 在資料庫強制執行，profiles 不允許瀏覽器改 role。
- 公開快取以 Supabase URL 區分，個人組套不持久寫入快取。登入狀態放在 sessionStorage（關閉分頁後需重新登入）；不保存密碼。
- SDK 僅在已填連線設定時從固定版本 CDN 載入。離線可使用公開快取或出廠資料；雲端写入沒有離線佇列。
- 保存模板時採欄位白名單，不傳送 clinicName、額外病人欄位、UI uid 或整個 R。自由文字仍由使用者負責只填組套設定。
- 存檔使用 version 條件，若另一人已修改，拒絕覆蓋。
- 背景更新保留本次處方並以藥品規格文字重新對應索引；遇到移除規格則保留原資料並要求完成處方後重新整理。

## 驗證狀態

001–007 已在測試與正式專案完成建置／SQL 驗證；測試網站的帳號隔離、跨裝置、密碼重設及介面操作已由使用者回報成功。正式登入已確認，過期重設連結與完整資料庫還原演練尚未完成。雲端模式的組套儲存使用明確的個人／系統按鈕，舊本機組套管理被封鎖，避免誤認為已同步。Admin 藥品管理與備份／匯入說明見下方更新。

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

004／005 已在測試與正式專案執行；真實測試網站的備份／匯入與權限操作已回報成功。


## 系統組套管理與密碼流程

追加執行 `006_system_management.sql`（一次性 migration），再以 `007_verify_system_management.sql` 驗證排序持久化、排序衝突、User 無法刪除、至少保留一個組套。驗證脚本在結尾 rollback；006／007 已在測試與正式專案完成。

- Admin 的「系統組套排序／刪除」視窗以按鈕上下移動；儲存前只更動暫存順序。儲存時傳送全庫版本快照，後端在同一交易更新排序。
- 刪除前顯示共用組套名稱；尚有未儲存排序時先要求儲存或重新開啟視窗。資料庫鎖與 trigger 保護至少一個系統組套，並檢查刪除對象版本。本次處方不清空。
- 新增組套排在目前清單最後。
- 在 `js/config.js` 填入 `resetRedirectUrl`，例如正式部署完成後的 `https://hsienht.github.io/Hp-regimen/`。到 Supabase Auth → URL Configuration 將實際網站設為 Site URL，並加入相同網址的 Redirect URLs。測試網站須使用它自己的精確網址，不要讓尚未有新程式的正式網站接收測試重設連結。
- 登入視窗輸入 Email 後按「忘記密碼」，才呼叫 Supabase 寄送重設信。接收 `PASSWORD_RECOVERY` 事件後顯示新密碼表單；使用者明確提交後以 `updateUser` 修改密碼。一般登入帳號也可按「變更密碼」。
- 使用 implicit URL session 偵測，讓 Email 連結能在另一分頁開啟；登入 session 放在該分頁的 sessionStorage。Auth 事件 callback 不等待 Auth API，避免 SDK 的鎖造成卡住。
- 新密碼需重複輸入且至少 8 個字元；Supabase 專案若設定更強密碼政策，仍以服務端驗證為準。明文密碼只在提交時傳給 Auth API，之後清除表單欄位，不進入組套備份／快取。
- 必須測試真實信件投遞、合法／過期重設連結、重設後登入，以及 Supabase 密碼政策與重設寄信限制。Node 回歸只測試模擬 API；真實測試網站的重設信件已完成，過期連結尚未驗收。

官方 Auth API：
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- https://supabase.com/docs/reference/javascript/auth-updateuser


## 測試版：帳號常用與名稱防重

先下載目前測試設定備份，在 `hp-regimen-v3-test` 執行 `008_preflight.sql`（唯讀）。若列出同名資料，先手動修改名稱，不自動刪除。沒有重複才整份執行 `008_favorites_names.sql`（一次性），再整份執行 `009_verify_favorites_names.sql`（結尾 rollback）。正式專案暫不執行。

更新頁面後登入，先按「重新取得雲端設定」。個人功能可搬移原帳號此瀏覽器常用清單；合併不刪本機清單。登入常用跨裝置同步，訪客常用仍只在此瀏覽器。系統／個人組套刪除會移除對應常用。

備份 v2 包含常用來源與名稱，不包含其他帳號清單；v1 仍可匯入。匯入個人組套後按來源／名稱對應常用，找不到或有多個對應時提示未加入。常用採合併；若個人組套使用取代模式，原個人項目的常用因刪除而移除，再套用備份常用。兩個 RPC 分別交易：若個人匯入成功但常用失敗，會明示部分完成，可重試合併。


## 正式候選升級順序（尚未授權執行）

1. 核對正式專案 ref 為 `qnahvcenvbzzbdgrdycq`，先執行 `008_preflight.sql`（唯讀）。沒有資料列表示目前沒有同分類、同帳號的重複名稱；這不表示 migration 已完成。
2. 在正式網站登入 Admin，下載目前設定 JSON 並保存。若有其他帳號需保存個人庫，各帳號另外備份。這份 JSON 不替代完整資料庫備份。
3. 取得使用者正式升級授權後，整份執行 `008_favorites_names.sql`，不重新執行 001／002／004／006。若預檢列出重複，先逐筆核對內容及名稱，另行確認改名；不得自動刪除／合併。migration 在 transaction 中完成，失敗時不要繼續發布前端。
4. 整份執行 `009_verify_favorites_names.sql`；腳本建立驗證用資料並於結尾 rollback。若出錯，確認交易已 rollback 後停止升級。
5. 核對候選 PR 的自動回歸成功、正式 config 保留、臨床預設沒有變更，才依授權合併並檢查 Pages 發佈。
6. 發佈後檢查訪客讀取、Admin 登入、個人儲存及常用持久化。自動化無法確認的真實 Email／裝置操作集中驗收。

前端回復以新提交恢復正式穩定版本 `77a5350b8f5830bcd2ffbe15efb7e7ef0b714755` 的前端檔案並保留正式 config。008 是新增常用表、名稱約束及更新匯入函式；回復前端時先保留這些資料庫變更，不直接 drop 新表或清除常用。資料庫還原需另外確認，完整還原演練目前未完成。
