module.exports = (app, io) => {
  const CacheController = require('../controllers/CacheController')(io);
  app.post('/api/cache', CacheController.createCache);
  app.put('/api/cache', CacheController.editCache);
  app.delete('/api/cache/:name', CacheController.deleteCache);
  app.get('/api/cache/:name', CacheController.getCache);
  app.post('/api/cache/:name', CacheController.putKey);

  app.get('/api/cache/:name/filter/points/startdate/:startdate/enddate/:enddate/key/:key', CacheController.getPointsEntry);
  app.get('/api/cache/:name/filter/range/startdate/:startdate/enddate/:enddate/key/:key', CacheController.getRangeEntry);
  app.get('/api/cache/:name/filter/top/days/:days', CacheController.getTopEntry);

  io.on('connection', (socket) => {
    socket.on('join', (data) => {
      const room = data.room;
      const attributes = data.attributes;
      const id = socket.id;
      socket.join(room);
      CacheController.joinCacheRoom(attributes, room, id);
    });
    socket.on('disconnect', (data) => {
      const id = socket.id;
      CacheController.leaveCacheRoom(id);
    });
  });

}

///testar/filter/points/startdate/2017-04-17/enddate/2017-04-17/key/{"ITEM" : "halebop", "RETAIELR" : "1234"}
