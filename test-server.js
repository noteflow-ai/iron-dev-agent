const express = require('express');
const app = express();
const port = 5678;

app.get('/', (req, res) => {
  res.send('Hello World! 测试服务器正常运行中');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`测试服务器运行中: http://localhost:${port}`);
});
