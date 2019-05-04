const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.static(path.join(__dirname, '/sw')));
app.use(express.static(path.join(__dirname, '/static')));

app.get('/', function(req,res) {
  let html = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
  res.send(html);
});

app.get('/info', function (req, res) {
  return res.json({
    msg: '这是服务器返回的数据'
  })
})

app.listen(8000, function() {
  console.log('服务启动成功')
})
