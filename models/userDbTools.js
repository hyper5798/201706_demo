var UserModel = require('./user.js');
var moment = require('moment');


exports.saveUser = function (name,password,email,level,callback) {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : saveUser()');
  var isEnable = false;
  var authz = {
    a01 : false,//user setting
    a02 : false,//index
    a03 : true,//new message
    a04 : true,//show data with chart
    a05 : true,//show data in table
    a06 : false,//device setting
  };

  if(name == 'admin'){
    isEnable = true;
    level = 0;
    authz = {
      a01 : true,//user setting
      a02 : true,//index
      a03 : true,//new message
      a04 : true,//show data with chart
      a05 : true,//show data in table
      a06 : true,//device setting
    };
  }

  var time = {
    date   : moment().format("YYYY-MM-DD HH:mm:ss"),
    year   : moment().format("YYYY"),
    month  : moment().format("YYYY-MM"),
    day    : moment().format("YYYY-MM-DD"),
    hour   : moment().format("YYYY-MM-DD HH"),
    minute : moment().format("YYYY-MM HH:mm"),
    cdate   : moment().format("YYYY-MM HH:mm")
  };

  console.log('Debug saveUser -> name :'+name);
  var newUser = new UserModel({
    name: name,
    password: password,
    email: email,
    enable: isEnable,
    level:level,//0:Hightest 1:normal
    authz: authz,
    update_at  : time,
    created_at: new Date()
  });
  newUser.save(function(err){
    if(err){
      console.log('Debug : User save fail!/n'+err);
      return callback(err);
    }
    console.log('Debug : User save success!');
      return callback(err,'success');
  });

};

/*
*Update name,password,authz
*json:{password : password, level : level ,autthz:authz }
*/
exports.updateUser = function (name,json,calllback) {
  console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : updateUser()');
  console.log('Debug : updateUser name='+name);
  var time = {
    date   : moment().format("YYYY-MM-DD HH:mm:ss"),
    year   : moment().format("YYYY"),
    month  : moment().format("YYYY-MM"),
    day    : moment().format("YYYY-MM-DD"),
    hour   : moment().format("YYYY-MM-DD HH"),
    minute : moment().format("YYYY-MM HH:mm"),
    cdate   : moment().format("YYYY-MM HH:mm")
  };
  json.update_at=time;

  if(name){
    UserModel.find({ name: name },function(err,users){
      if(err){
        console.log('Debug : updateUser find user by name =>'+err);
        return calllback(err);
      }
      if(users.length>0){
        var userId = users[0]._id;
        console.log('Debug : getUserId device ' + users);
        console.log('Debug : getUserId : ' +userId);
        UserModel.update({_id : userId},
          json,
          {safe : true, upsert : true},
          (err, rawResponse)=>{
            if (err) {
                      console.log('Debug : updateUser : '+ err);
                      return calllback(err);
            } else {
                      console.log('Debug : updateUser : success');
                return calllback(err,'success');
              }
            }
          );
      }else{
        console.log('Debug : updateUser can not find user!');
        return calllback('Can not find user!');
      }
    });
  }else{
    console.log('Debug : updateUser no referance');
        return calllback('Referance nul!');
  }
};

/*
*Remove all of users
*Return -1:資料存取錯誤 0:刪除完成 1:刪除失敗
*/
exports.removeAllUsers = function (calllback) {
    UserModel.remove({}, (err)=>{
      console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : removeAllUsers');
      if (err) {
        console.log('Debug : User remove all occur a error:', err);
            return calllback(err);
      } else {
        console.log('Debug : User remove all success.');
            return calllback(err,'success');
      }
    });
};

exports.removeUserByName = function (name,calllback) {
    UserModel.remove({name:name}, (err)=>{
      console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : removeUserByName()');
      if (err) {
        console.log('Debug : User remove name :'+name+' occur a error:', err);
            return calllback(err);
      } else {
        console.log('Debug : User remove name :'+name+' success.');
            return calllback(err,'success');
      }
    });
};

/*Find all of users
*/
exports.findAllUsers = function (calllback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : findAllUsers()');
    UserModel.find((err, users) => {
      if (err) {
        console.log('Debug : findAllUsers err:', err);
            return calllback(err);
      } else {
            console.log('Debug : findAllUsers success\n:',users.length);
        return calllback(err,users);
      }
    });
};

exports.findUserByName = function (name,calllback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : findUserByName()');
    UserModel.find({ name: name }, function(err,users){
      if(err){
        return callback(err);
      }
      if (users.length>0) {
        console.log('find '+users);
        return calllback(err,users[0]);
      }else{
        console.log('找不到資料!');
        return calllback(err,null);
      }
    });
};