[Uploading README.md…]()# Clinical Weekly Helper

這是一個不串 API、不儲存病人資料的靜態網頁工具。

## 功能

- 貼上前次 Weekly Summary
- 貼上本週 Progress Notes
- 輸入病人基本資料
- 選擇病人類型
- 自動產生可貼到 ChatGPT 的完整指令
- 一鍵複製
- 一鍵清除全部病人資料

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
