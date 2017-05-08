// grab the things we need
var mongoose = require('./mongoose.js');
var Schema = mongoose.Schema;

// create a schema
var listSchema = new Schema({
  name : { type: String},
  recv : { type: Date},
  list : { type: Schema.Types.Mixed}
});

// the schema is useless so far
// we need to create a model using it
var List = mongoose.model('List', listSchema);

// make this available to our users in our Node applications
module.exports = List;
