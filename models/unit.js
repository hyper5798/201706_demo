var mongoose = require('./mongoose.js');
var Schema = mongoose.Schema;

// create a schema
var unitSchema = new Schema({
  type: { type: String},
  typeString: { type: String},
  macAddr: { type: String},
  name: { type: String},
  status:{ type: Number},
  update_at: { type: Schema.Types.Mixed},
  created_at: { type: Date}
});

// the schema is useless so far
// we need to create a model using it
var Unit = mongoose.model('Unit', unitSchema);

// make this available to our users in our Node applications
module.exports = Unit;