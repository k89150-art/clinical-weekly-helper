[README.md](https://github.com/user-attachments/files/29587068/README.md)
[Uploading README.md…]()# Clinical Weekly Helper

這是一個不串 API、不儲存病人資料的靜態網頁工具。

## 功能

- 貼上前次 Weekly Summary
- 貼上本週 Progress Notes
- 輸入病人基本資料
- 選擇病人類型
- 自動產生可貼到 ChatGPT 的完整指令
- 一鍵複製（可選：複製後自動清除全部內容）
- 一鍵清除全部病人資料
- 即時字數統計，內容偏長時會提醒確認 GPT 是否能接受該長度
- 純前端隱私偵測：貼上的內容若出現疑似身分證字號、手機號碼、病歷號標註、或伴隨關鍵字的生日格式，會跳出警示提醒手動移除（偵測完全在瀏覽器本機執行，不會上傳或記錄任何內容）
- 離開分頁前，若還有未清除的內容會跳出瀏覽器提醒，避免不小心關掉分頁遺失資料
- 響應式版面，筆電、院內小螢幕、平板皆可使用

## 隱私原則

本工具為純前端靜態網頁：

- 不上傳病人資料
- 不使用資料庫
- 不保存 progress notes
- 不保存 weekly 或交班單
- 完成後請按「清除全部」

仍建議貼資料前先移除：

- 病人姓名
- 病歷號
- 身分證字號
- 完整生日
- 電話
- 地址

頁面內建的隱私偵測只是輔助提醒（規則式比對，非 100% 準確），無法取代人工確認，仍請貼上前自行檢查一次。

## GitHub Pages 部署

1. 建立 repository，例如 `clinical-weekly-helper`
2. 上傳以下檔案：
   - `index.html`
   - `style.css`
   - `script.js`
   - `README.md`
3. 到 Settings → Pages
4. Source 選擇 `Deploy from a branch`
5. Branch 選擇 `main`，資料夾選 `/root`
6. 儲存後等待 GitHub Pages 產生網址

## 使用方式

1. 打開網頁
2. 貼上前次 weekly，可空白
3. 貼上本週 progress notes
4. 填寫補充事項
5. 按「產生 ChatGPT 指令」
6. 按「複製指令」
7. 貼到 ChatGPT
8. 使用後按「清除全部」
