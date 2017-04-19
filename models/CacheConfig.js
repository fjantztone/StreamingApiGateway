const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

let keySchema = new Schema({
  expireAt : {type : Date, required: true},
  createdAt : {type : Schema.Types.String, default : moment().format(), required:true},
  key : Schema.Types.Object
}, {versionKey : false});

keySchema.index({ "expireAt": 1 }, { expireAfterSeconds: 0 });

let cacheSchema = new Schema({
    expireDays : {type : Number, required : [true, 'Expired days must exists.'], validate : {
      validator : (expireDays) => {
        return expireDays >= 1 && expireDays <= 31;
      },
      message : 'Expire days must be between 1 and 31.'
    }},
    name : {type : String, required : true, validate : {
      validator : (name, cb) => {
        CacheConfig.find({name : name}, (err, docs) => {
          cb(docs.length === 0);
        });
      },
      message : 'Cache already exists.'
    }},
    attributes : {type : [Schema.Types.String], required : [true, 'Attributes must exist.']},
    levels : {type : [[]], required : [true, 'One level must exist.']}, //levels should be validated against fields
    createdAt : {type : Schema.Types.String, default : moment().format(), required:true},
    data: [keySchema]
}, {versionKey : false});

const CacheConfig = mongoose.model('CacheConfig', cacheSchema);

module.exports = CacheConfig;
