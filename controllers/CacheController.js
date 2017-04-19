const fetch = require('node-fetch');
const moment = require('moment');
const baseUrl = 'http://localhost:8081/api/cache';
const CacheConfig = require('../models/CacheConfig');
const caches = {};

module.exports = (io) => {
  return CacheController = {
    createCache : (req, res, next) => {
      cacheConfig = new CacheConfig(req.body);
      cacheConfig.save()
      .then(cacheConfig => {
        if(!cacheConfig)
          throw new Error("Cache could not be inserted to database..");
        return fetch(baseUrl, {
          method : 'POST',
          body : cacheConfig
        });
      })
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);
        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });
    },
    editCache : (req, res, next) => {
      const cacheConfig = req.body;
      CacheConfig.findOneAndUpdate({name : cacheConfig.name}, cacheConfig)
      .then(cacheConfig => {
        if(!cacheConfig)
          throw new Error("Cache could not be edited in database..");
        return fetch(baseUrl, {
          method : 'PUT',
          body : cacheConfig
        });
      })
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);
        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });
    },
    deleteCache : (req, res, next) => {
      const name = req.params.name;
      CacheConfig.remove({name : name})
      .then(cacheConfig => {
        if(!cacheConfig)
          throw new Error("Cache could not be removed from database..");
        return fetch(baseUrl + '/' + 'name', {
          method : 'DELETE',
          body : cacheConfig
        });
      })
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);
        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });
    },
    getCache : (req, res, next) => {
      const name = req.params.name;
      fetch(baseUrl + '/' + name)
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);
        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });
    },
    putKey : (req, res, next) => {
      const name = req.params.name;
      const key = req.body; //must convert to json
      CacheConfig.findOne({name : name})
      .then(cacheConfig => {
        console.log(cacheConfig);
        if(!cacheConfig)
          throw new Error("No cache config was found with that name.");

        const expireDays = cacheConfig.expireDays;
        const data = {};
        data.key = key;
        data.expireAt = moment().add(expireDays, 'days').format();
        
        return cacheConfig.update({$push : {data : data}}, {runValidators : true});

      })
      .then(cacheConfig => {
        if(!cacheConfig)
          throw new Error("Key could not be inserted into cache..");
        return fetch(baseUrl + '/' + name, {
          method : 'POST',
          body : JSON.stringify(key)
        });
      })
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);

        CacheController.emitKeys(name, json);
        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });
    },
    getEntry : (req, res, next) => {
      ///:name/filter/points/startdate/:startdate/enddate/:enddate/key/:key
      const name = req.params.name;
      const startDate = req.params.startdate;
      const endDate = req.params.enddate;
      const key = req.params.key;
      const filter = req.params.filter;

      fetch(baseUrl + '/' + name + '/filter/' + filter + '/startdate/' + startDate + '/enddate/' + endDate + '/key/' + key)
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);

        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });

    },
    getPointsEntry : (req, res, next) => {
      req.params.filter = 'points';
      return CacheController.getEntry(req, res, next);
    },
    getRangeEntry : (req, res, next) => {
      req.params.filter = 'range';
      return CacheController.getEntry(req, res, next);
    },
    getTopEntry : (req, res, next) => {
      const name = req.params.name;
      const days = req.params.days;
      fetch(baseUrl + '/' + name + '/filter/top/days/' + days)
      .then(res => res.json().then(json => ({
        status : res.status,
        json : json
      })))
      .then(({status, json}) => {
        if(status !== 200)
          throw new Error(json.message);

        res.json(json);
      })
      .catch(err => {
        res.status(400).json(err.message);
      });
    },
    joinCacheRoom : (attributes, room, id) => {

      attributes.map(attribute => JSON.stringify(attribute)).forEach(attribute => {
        if(!caches.hasOwnProperty(room))
          caches[room] = {};
        if(!caches[room].hasOwnProperty(attribute))
          caches[room][attribute] = [];
        caches[room][attribute].push(id);

        console.log("join!");
        console.log(caches);
      });
    },
    leaveCacheRoom : (id) => { //if disconnect we cant know the room..
      for(let room of Object.keys(caches)){
        let cacheRoom = caches[room];
        for(let attribute of Object.keys(cacheRoom)){
          let cacheRoomAttribute = cacheRoom[attribute];
          const index = cacheRoomAttribute.indexOf(id);
          cacheRoomAttribute.splice(index, 1);

          if(cacheRoomAttribute.length === 0)
            delete cacheRoom[attribute];
        }
        if(Object.keys(cacheRoom).length === 0)
          delete caches[room];
      }

      console.log("disconnect!");
      console.log(caches);
    },
    emitKeys : (room, attributes) => {
      console.log("EMITTING KEYS TO SUBSCRIBERS!");
      if(caches.hasOwnProperty(room)){ //only emit if exists
        let cacheRoom = caches[room];
        key = attributes.map(attribute => JSON.stringify(attribute.key));
        for(let attribute of Object.keys(cacheRoom)){
          //if attribute is subset of key
          //propagate to all sockets there
          const index = key.indexOf(attribute); //lazy compare right now. should probably sort the object's keys etc.
          if(index != -1){
            const ids = cacheRoom[attribute];
            const data = attributes[index];

            ids.forEach(id => {
              io.sockets.connected[id].emit('new_data', data);
            });

          }

        }
      }

    }

  }

}
