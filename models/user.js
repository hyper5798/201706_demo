var mongoose = require('./mongoose.js');
var Schema = mongoose.Schema;

// create a schema
var userSchema = new Schema({
  name: { type: String},
  password: { type: String},
  email: { type: String},
  enable: { type: Boolean},
  level:{type: Number},//0:Hightest 1:normal
  authz: { type: Schema.Types.Mixed},
  update_at: { type: Schema.Types.Mixed},
  created_at: { type: Date}
});

// the schema is useless so far
// we need to create a model using it
var User = mongoose.model('User', userSchema);

// make this available to our users in our Node applications
module.exports = User;