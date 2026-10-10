# JSON 檢查與格式化：Release candidate

任務 THREAD-02-json-workbench；2026-10-10；供主對話獨立驗收。候選來源倉庫：[KYStr/glossquote-labs-json-workbench](https://github.com/KYStr/glossquote-labs-json-workbench)。來源公開的verified HEAD另於本次發布後追加；目前文件不把網站宣稱已部署。

產品：原生 HTML/CSS/ESM、零runtime/development套件，繁中與英文介面。嚴格、受限JSON parser保留每個數字／字串raw token與順序；重複鍵依decoded精確判等；內容僅當頁記憶體；真正Worker、取消／clear／5秒timeout、clipboard fallback與UTF8下載。

候選正式頁面（NOT_DEPLOYED）：

- `https://json.glossquote.com/index.html`（zh-Hant）
- `https://json.glossquote.com/en/index.html`（en）

本機驗收：Node 24+，`npm.cmd test`、`npm.cmd run check`、`npm.cmd run build`；預覽 `npm.cmd run dev` → `127.0.0.1:4182`，有衝突以 `-- --port=0`。修改core／worker後 `npm.cmd run build:worker`。完整案例／人工例外見 [VALIDATION](VALIDATION.md)。

正式產物：`npm.cmd run build:release` 明確指定且限制origin，生成dist，具備兩語canonical、reciprocal hreflang／x-default、2頁sitemap、robots、404，以及CSP／nosniff／Referrer／Permissions／MIME `_headers`。public始終noindex，預設build產生preview noindex且沒有sitemap；release不會改public。wrangler配置使用assets-only、html_handling=none以保留index.html網址、404-page、禁workers.dev／preview URLs；無account ID或秘密。

本次不讀任何憑證、不部署、不修改00-home、其他工具、DNS／帳戶／正式Worker。正式release是原主對話整合範圍：

1. 獨立檢查公開來源commit與SHA256清單、允許的人工NOT_RUN；再跑必要release build。
2. 以主對話已審核的部署runtime檢查wrangler schema／dry-run並部署免費的json.glossquote.com；此工具對話未安裝Wrangler（依零development依賴及不讀憑證邊界），dry-run與live結果NOT_RUN。
3. 驗證兩語live HTTPS／狀態／MIME／security headers／canonical／hreflang／robots／sitemap／404與實際Worker運算後，才把00-home/catalog切published。
4. 主對話 rebuild、validate、publish獨立首頁source、deploy homepage並驗證兩語live catalog；各項source／hosting證據分開記錄。

這是整合驗收等待，沒有要求使用者重複授權。人工例外：Firefox、實體手機／touch、native zoom200%、screen reader／独立AA稽核與真OS clipboard成功寫入NOT_RUN；CSS320px／200%與keyboard已測。没有搜尋收錄、效能或安全認證保證。

範圍與變更：public（兩語頁面、worker/core/session/export/locales與styles/favicon／404／headers）、scripts（安全serve/check/build、worker bundle、SEO／asset verifier、publication review）、test（offline fake data）、必要docs／README／package／project／.gitignore／wrangler。根repo未commit/branch/index操作；所有publishing只用獨立reviewed副本。

Status: LOCAL_MVP_COMPLETE_WITH_MANUAL_NOT_RUN；T08/T09發布與guard結束後由HANDOFF給出READY_FOR_INTEGRATION或具體BLOCKED。
