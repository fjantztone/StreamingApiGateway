module.exports = (app, io) => {
  const CacheController = require('../controllers/CacheController')(io);
  app.post('/api/cache', CacheController.createCache);
  app.put('/api/cache', CacheController.editCache);
  app.delete('/api/cache/:name', CacheController.deleteCache);
  app.get('/api/cache/:name', CacheController.getCache);
  app.post('/api/cache/:name', CacheController.putKey);

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
