const express = require('express');
const path = require('path');
const app = express();

// 設定伺服器的埠號
const PORT = process.env.PORT || 3000;

// 服務靜態檔案
app.use(express.static(path.join(__dirname, 'public')));

// 處理根路徑請求，將 index.html 發送回客戶端
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 啟動伺服器
app.listen(PORT, () => {
    console.log(`伺服器正在執行，訪問 http://localhost:${PORT}`);
});

// test