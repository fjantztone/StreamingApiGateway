const app = require('express')();
const bodyParser = require('body-parser');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mongoose = require('mongoose');
const port = 3001;
const hostname = "localhost";

mongoose.connect('mongodb://localhost/streamingdata', (err) => {
  if(!err)
    console.log("Connected to database");
});
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

app.use(bodyParser.json());

const CacheService = require('./services/CacheService')(app, io);
