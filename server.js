var express = require('express'),
    app     = express();

app.get('/', function(req, res) {
  res.send('<h1>seaver</h1');
});

app.listen(1969, function () {
  console.log('Here we go');
})
