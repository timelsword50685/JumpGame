const express = require('express');
const app = express();

// 提供 public 文件夾內的靜態資源
app.use(express.static('public'));

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});