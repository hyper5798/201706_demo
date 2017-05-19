var debug = false;
var express = require('express');
var router = express.Router();
var DeviceDbTools = require('../models/deviceDbTools.js');
var UnitDbTools = require('../models/unitDbTools.js');
var JsonFileTools =  require('../models/jsonFileTools.js');
var UserDbTools =  require('../models/userDbTools.js');
var log =  require('../models/log.js');
var settings = require('../settings');
var moment = require('moment');
var noWeatherDevice = true;
var finalList = {};
var infoPath = './public/data/deviceInfos.json';
var finalPath = './public/data/finalList.json';
var logPath = './public/data/log.json';
var unitPath = './public/data/unit.json';
var userPath = './public/data/user.json';
var ctrlPath = './public/data/ctrl.json';

var hour = 60*60*1000;

function getNewData(obj){
	var device = finalList[obj.macAddr];
	if(device){
		var now = moment();
		var recv = moment(device.recv);
		if(debug){
			console.log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@');
			console.log('obj.macAddr : '+obj.macAddr+'\n'+ JSON.stringify(device));
			console.log('recv_time : '+device.recv);
			console.log('now : '+now );
			console.log('recv : '+recv );
			console.log('result : '+((now - recv)/hour) );
			console.log('device.info.volatage : '+device.info.volatage );
		}

		if(device.info.volatage && device.info.volatage<350){
			obj.status = 1;
		}else if( ((now - recv)/hour) > 72){//loss
			obj.status = 2;
		}else{
			obj.status = 0;
		}
	}else{
		obj.status = 2;
	}


	return obj;
}



function findUnitsAndShowSetting(req,res,isUpdate){
	UnitDbTools.findAllUnits(function(err,units){
		var successMessae,errorMessae;
		var macTypeMap = {};

		if(err){
			errorMessae = err;
		}else{
			if(units.length>0){
				successMessae = '查詢到'+units.length+'筆資料';
			}
			/*for(var i=0;i<units.length;i++){
				console.log( "unit :"+units[i] );
				if(units[i].macAddr){
					console.log('mac ('+i+'):'+units[i].macAddr);
					if(units[i].type){
						macTypeMap[units[i].macAddr]=units[i].type;
					}
				}
			}
			//Jason add for save mac array on 2016.08.18
			if(isUpdate){//For new and delete unit
				JsonFileTools.saveJsonToFile('./public/data/macTypeMap.json',macTypeMap);
			}*/
		}
		req.session.units = units;

		console.log( "successMessae:"+successMessae );
		res.render('editDevice', { title: '裝置編輯',
			user:req.session.user,
			units:units,
			success: successMessae,
			error: errorMessae
		});
	});
}

function findUnitsAndShowNotify(req,res,isUpdate){
	UnitDbTools.findAllUnits(function(err,units){
		var successMessae,errorMessae;
		var allInfos = JsonFileTools.getJsonFromFile(infoPath);
		var selectedType = req.flash('type').toString();
		var typeKeys = Object.keys(allInfos);
		//console.log(typeKeys.indexOf(selectedType));
		if(typeKeys.indexOf(selectedType) === -1){//Can't find info with selected type
			selectedType = typeKeys[0];
		}
		var info = allInfos[selectedType];
		var keys = Object.keys(info.fieldName);

		console.log( "notify:"+info.fieldName[keys[0]]['notify'] );
		if(err){
			errorMessae = err;
		}else{
			if(units.length>0){
				successMessae = '查詢到'+units.length+'筆資料';
			}
		}
		req.session.units = units;

		console.log( "successMessae:"+successMessae );
		res.render('editNotify', { title: '通知設定',
			user:req.session.user,
			units:units,
			info:info,
			selectedType:selectedType,
			success: successMessae,
			error: errorMessae
		});
	});
}

module.exports = function(app){
  
  app.get('/', checkLogin);
  
  app.get('/', function (req, res) {
	//var time    = req.query.time;
	UnitDbTools.findAllUnits(function(err,units){
		var successMessae,errorMessae;
		var macTypeMap = {};
		if(err){
			req.session.units = [];
		}
		req.session.units = units;
		//Jason add for show notify
		//[number,arr] notify[0]:notify number notify[1]:notify list
		var notify = getNotifyList();
		//Jason add for show logs
		var logs = getLogList();
		var deviceList = getDeviceList(units);
		//Jason add for user info in index on 2017.05.15
		var users = JsonFileTools.getJsonFromFile(userPath);
		
		res.render('index', { title: '首頁',
			user:req.session.user,
			units:units,
			notifyNumber:notify[0],
			notifyList:notify[1],
			deviceList:deviceList,
			logs:logs,
			users:users
		});
	});
  });

  //Jason add for delete log on 2017.05.15
  app.get('/del/:time', function (req, res) {
	var time    = req.params.time;
	if(time){
		toUpdateLogByTime(time);
		var allLogs = JsonFileTools.getJsonFromFile(logPath);
		if(time && allLogs[time]){
			delete allLogs[time];
			
			JsonFileTools.saveJsonToFile(logPath,allLogs);
		}
		return res.redirect('/');
	}
  });

  app.get('/login', checkNotLogin);
  app.get('/login', function (req, res) {
	req.session.user = null;
  	var name = req.flash('post_name').toString();
	var successMessae,errorMessae;
	console.log('Debug register get -> name:'+ name);

	if(name ==''){
		errorMessae = '';
		res.render('user/login', { title: '登入',
			error: errorMessae
		});
	}else{
		var password = req.flash('post_password').toString();

		console.log('Debug register get -> password:'+ password);
		UserDbTools.findUserByName(name,function(err,user){
			if(err){
				errorMessae = err;
				res.render('user/login', { title: '登入',
					error: errorMessae
				});
			}
			if(user == null ){
				//login fail
				errorMessae = '無此帳號';
				res.render('user/login', { title: '登入',
					error: errorMessae
				});
			}else{
				//login success
				if(password == user.password){
					req.session.user = user;
					return res.redirect('/');
				}else{
					//login fail
					errorMessae = '密碼錯誤';
					res.render('user/login', { title: '登入',
						error: errorMessae
					});
				}
			}
		});
	}
  });

  app.post('/login', checkNotLogin);
  app.post('/login', function (req, res) {
  	var post_name = req.body.account;
  	var	post_password = req.body.password;
  	console.log('Debug login post -> name:'+post_name);
	console.log('Debug login post -> password:'+post_password);
	req.flash('post_name', post_name);
	req.flash('post_password', post_password);
	return res.redirect('/login');
  });

  app.get('/register', checkNotLogin);
  app.get('/register', function (req, res) {
  	var name = req.flash('post_name').toString();
	var password = req.flash('post_password').toString();
	var email = req.flash('post_email').toString();
	var successMessae,errorMessae;
	var count = 0;
	var level = 1;
	console.log('Debug register get -> name:'+ name);
	console.log('Debug register get -> password:'+ password);
	console.log('Debug register get -> email:'+ email);
	if(name==''){
		//Redirect from login
		res.render('user/register', { title: '註冊',
			error: errorMessae
		});
	}else{
		//Register submit with post method
		var test = false;
		if(test == true){ //for debug to remove all users
			UserDbTools.removeAllUsers(function(err,result){
				if(err){
					console.log('removeAllUsers :'+err);
				}
				console.log('removeAllUsers : '+result);
			});
		}

		UserDbTools.findUserByName(name,function(err,user){
			if(err){
				errorMessae = err;
				res.render('user/register', { title: '註冊',
					error: errorMessae
				});
			}
			console.log('Debug register user -> name: '+user);
			if(user != null ){
				errorMessae = '已有此帳號';
				res.render('user/register', { title: '註冊',
					error: errorMessae
				});
			}else{
				//save database
				if(name == 'admin'){
					level = 0;
				}
				UserDbTools.saveUser(name,password,email,level,function(err,result){
					if(err){
						errorMessae = '註冊帳戶失敗';
						res.render('user/register', { title: '註冊',
							error: errorMessae
						});
					}
					//Jason add for user info in index on 2017.05.15
					var users = JsonFileTools.getJsonFromFile(userPath);
					users.push(name);
					JsonFileTools.saveJsonToFile(userPath,users);

					UserDbTools.findUserByName(name,function(err,user){
						if(user){
							req.session.user = user;
						}
						return res.redirect('/');
					});
				});
			}
		});
	}
  });

  app.post('/register', checkNotLogin);
  app.post('/register', function (req, res) {
		var post_name = req.body.register_account;

		var successMessae,errorMessae;
		var	post_password = req.body.register_password;
		var	post_email = req.body.register_email;
		console.log('Debug register post -> post_name:'+post_name);
		console.log('Debug register post -> post_password:'+post_password);
		console.log('Debug register post -> post_emai:'+post_email);
		req.flash('post_name', post_name);
		req.flash('post_password', post_password);
		req.flash('post_email', post_email);
		return res.redirect('/register');
  });

  app.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '');
    res.redirect('/login');
  });

  app.get('/weather', checkLogin);
  app.get('/weather', function (req, res) {

		console.log('Debug weather get -> render to weather.ejs');
		var fullUrl = req.protocol + '://' + req.get('host') + '/ui/#/0';
		console.log('Debug weather fullUrl :'+fullUrl);
		res.render('weather', { title: '微型氣象站',
			units:req.session.units,
			user:req.session.user,
			success: null,
			error: null,
			weatherUrl: fullUrl
		});

  });

  app.get('/chart', checkLogin);
  app.get('/chart', function (req, res) {

		console.log('Debug chart get -> render to find.ejs');
		var find_mac = req.flash('mac').toString();
		var option = req.flash('option').toString();
		var successMessae,errorMessae;
		var count = 0;
		var timeStr = '';
		console.log('Debug chart get -> find mac:'+find_mac);
		console.log('Debug chart get -> find option:'+option);
		res.render('chart', { title: '圖表分析',
			units:req.session.units,
			user:req.session.user,
			mac:find_mac,
			option:option,
			mdate:moment().format('YYYY-MM-DD'),
			devices: null,
			timeStr:timeStr,
			success: successMessae,
			error: errorMessae
		});

  });

  /*app.post('/chart', function (req, res) {
		var	post_mac = req.body.mac;
		var option = req.body.time_option;
		console.log('option:'+option);
		console.log('find mac:'+post_mac);
		req.flash('mac', post_mac);
		req.flash('option', option);
		return res.redirect('/chart');
  });*/

  app.get('/update', checkLogin);
  app.get('/update', function (req, res) {
	  //Jason add for filter weather device start
  		var newUnits = [];
  		var units = req.session.units;
  		for(var i = 0;i<units.length;i++){
  			//console.log('Debug update -> check '+ units[i].name +' type : '+ units[i].type);
  			console.log('Debug update -> check '+ JSON.stringify(units[i]));
  			if(units[i].type == 'aa00'){
  				newUnits.push(units[i]);
  			}
  		}
		//Jason add for filter weather device -- end
		res.render('update', { title: '最新訊息',
			units  : newUnits,
			user   : req.session.user,
			success: null,
			error  : null
		});
  });

  app.get('/find', checkLogin);
  app.get('/find', function (req, res) {
		console.log('render to find.ejs');
		var find_mac = req.flash('mac').toString();
		var option = req.flash('option').toString();
		var mdate = req.flash('mdate').toString();
		var successMessae,errorMessae,findType;
		var count = 0;

		console.log('Debug find get -> mac:'+ find_mac);
		console.log('Debug find get -> option:'+ option);
		console.log('Debug find get -> date:'+ mdate);
		if(find_mac == ""){
			res.render('find', { title: '資料查詢',
				units:req.session.units,
				user:req.session.user,
				mac:find_mac,
				option:option,
				mdate:moment().format('YYYY-MM-DD'),
				devices: null,
				success: successMessae,
				error: errorMessae,
				selectedType:findType
			});
		}else{
			//Jason modify for get selected device type on 2016.0.21
			req.session.units.forEach(function(unit) {
				if(unit.macAddr == find_mac){
					console.log('unit.type:'+unit.type);
					findType = unit.type;
				}
			});
			DeviceDbTools.findDevicesByDate(mdate,find_mac,Number(option),'asc',function(err,devices){
				if(err){
					console.log('find name:'+find_mac+" err : "+err);
					req.flash('error', err);
					return res.redirect('/find');
				}

				/*devices.forEach(function(device) {
					console.log('mac:'+device.macAddr + ', data :' +device.data);
					count = count +1;
				});*/
				//console.log('find type:'+findType);
				//console.log('Debug find get mac '+find_mac+'-> find '+devices.length+' records');
				console.log('Debug find device '+find_mac+'-> find '+devices);
				successMessae = '查詢到'+devices.length+'筆資料';
				var newDevices = [];
				if(findType == 'aa00' || findType == 'aa03 '){
					newDevices = devices;
				}

				res.render('find', { title: '資料查詢',
					units:req.session.units,
					user:req.session.user,
					mac:find_mac,
					option:option,
					mdate:mdate,
					devices: devices,
					success: successMessae,
					error: errorMessae,
					selectedType:findType
				});
			});
		}
  });

  /*app.post('/find', checkLogin);
  app.post('/find', function (req, res) {
		var	post_mac = req.body.mac;
		var option = req.body.time_option;
		var mdate = req.body.datepicker1;
		console.log('Debug find post -> option:'+option);
		console.log('Debug find post -> find mac:'+post_mac);
		console.log('Debug find post -> date:'+mdate);
		req.flash('mac', post_mac);
		req.flash('option', option);
		req.flash('mdate', mdate);
		return res.redirect('/find');
  	});*/

  app.get('/editDevice', checkLogin);
  app.get('/editDevice', function (req, res) {
	    console.log('render to setting.ejs');
		findUnitsAndShowSetting(req,res,true);
  });

  app.post('/editDevice', checkLogin);
  app.post('/editDevice', function (req, res) {
		var	post_mac = req.body.mac;
		var post_name = req.body.name;
		var post_type = req.body.type_option;
		var post_mode = req.body.mode;
		var typeString = req.body.typeString;
		if(req.body.overtime === undefined || req.body.overtime === ''){
			var overtime = 2;
		}else{
			var overtime = Number(req.body.overtime);
		}

		console.log('mode : '+post_mode);
		if(post_mode == 'new'){
			if(	post_mac && post_name && post_mac.length==8 && post_name.length>=1){
				console.log('post_mac:'+post_mac);
				console.log('post_name:'+post_name);
				UnitDbTools.saveUnit(post_mac,post_name,post_type,typeString,overtime,function(err,result){
					if(err){
						req.flash('error', err);
						return res.redirect('/editDevice');
					}
					saveUnit('new',post_mac,post_name);
					findUnitsAndShowSetting(req,res,true);
				});
				return res.redirect('/editDevice');
			}
		}else if(post_mode == 'del'){//Delete mode
			post_mac = req.body.postMac;
			UnitDbTools.removeUnitByMac(post_mac,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + err);
					return res.redirect('/editDevice');
				}else{
					req.flash('error', err);
					console.log('removeUnitByMac :'+post_mac + 'success');
				}
				saveUnit('del',post_mac,post_name);
				findUnitsAndShowSetting(req,res,false);
			});

		}else{//Edit mode
			post_mac = req.body.postMac;
			UnitDbTools.updateUnit(post_type,post_mac,post_name,null,typeString,overtime,function(err,result){
				if(err){
					req.flash('error', err);
					console.log('edit  :'+post_mac + err);
					return res.redirect('/editDevice');
				}else{
					console.log('edit :'+post_mac + 'success');
				}
				saveUnit('edit',post_mac,post_name);
				findUnitsAndShowSetting(req,res,false);
			});
		}
  	});

  app.get('/editNotify', checkLogin);
  app.get('/editNotify', function (req, res) {
	    console.log('render to setting.ejs');
		findUnitsAndShowNotify(req,res);
  });

  app.post('/editNotify', checkLogin);
  app.post('/editNotify', function (req, res) {
		var	mode = req.body.mode;
		var	type = req.body.type;

		if(mode === 'save'){
			var max = req.body.max;
			var min = req.body.min;
			var maxInfo = req.body.maxInfo;
			var minInfo = req.body.minInfo;
			console.log('Debug find mode :'+mode);
			console.log('Debug find type :'+type);
			console.log('Debug find max :'+JSON.stringify(max));
			console.log('Debug find min :'+JSON.stringify(min));
			console.log('Debug find maxInfo :'+JSON.stringify(maxInfo));
			console.log('Debug find minInfo :'+JSON.stringify(minInfo));
			var allInfos = JsonFileTools.getJsonFromFile(infoPath);
			var info = allInfos[type];
			info = changeNotify(max,min,maxInfo,minInfo,info);
			allInfos[type] = info;
			JsonFileTools.saveJsonToFile(infoPath,allInfos);
		}
		req.flash('mode', mode);
		req.flash('type', type);
		return res.redirect('/editNotify');
  	});

   app.get('/info', checkLogin);
   app.get('/info', function (req, res) {
		console.log('render to info.ejs');
		var save_password = req.flash('password').toString();
		var save_name = req.flash('name').toString();
		var save_email = req.flash('email').toString();
		var user = req.session.user;
		var successMessae,errorMessae;
		console.log('save_password:'+save_password);
		console.log('save_name:'+save_name);
		console.log('save_email:'+save_email);
		var json = {password:save_password};
		if(save_password==''){
			res.render('user/info', { title: '帳號資訊',
					user:req.session.user,
					error: errorMessae,
					success: null
				});
		}else{
			if(save_password == user.password){
				return res.redirect('/');
			}
			UserDbTools.updateUser(user.name,json,function(err,result){
				if(err){
					req.flash('error', err);
					req.flash('success', null);
					return res.redirect('/info');
				}
				req.session.user = null;
				errorMessae = '密碼已更改請重新登入';
				res.render('user/login', { title: '登入',
					error: errorMessae
				});
			});
		}
    });

  	app.post('/info', checkLogin);
  	app.post('/info', function (req, res) {
		var	post_password = req.body.password;
		var	post_name = req.body.name;
		var	post_email = req.body.email;
		console.log('post_password:'+post_password);
		console.log('post_name:'+post_name);
		console.log('post_email:'+post_email);
		req.flash('password',post_password);
		req.flash('name', post_name);
		req.flash('email', post_email);
		return res.redirect('/info');
  	});

  	app.get('/account', checkLogin);
    app.get('/account', function (req, res) {

		console.log('render to account.ejs');
		var refresh = req.flash('refresh').toString();
		var myuser = req.session.user;
		var myusers = req.session.userS;
		var successMessae,errorMessae;
		var post_name = req.flash('name').toString();

		console.log('Debug account get -> refresh :'+refresh);
		UserDbTools.findAllUsers(function (err,users){
			if(err){
				errorMessae = err;
			}
			if(refresh == 'delete'){
				successMessae = '刪除帳號['+post_name+']完成';
			}else if(refresh == 'edit'){
				successMessae = '編輯帳號['+post_name+']完成';
			}
			req.session.userS = users;
			console.log('Debug account get -> users:'+users.length+'\n'+users);
			console.log('----------------------------------------------------------------');
			console.log('Debug account get -> users:'+users[0].authz.a01);
			console.log('----------------------------------------------------------------');
			//console.log('Debug account get -> user:'+mUser.name);
			res.render('user/account', { title: '帳戶管理', // user/account : ejs path
				user:myuser,//current user : administrator
				users:users,//All users
				error: errorMessae,
				success: successMessae
			});
		});
    });

  	app.post('/account', checkLogin);
  	app.post('/account', function (req, res) {
  		var	post_name = req.body.postName;
		var postSelect = req.body.postSelect;
		console.log('post_name:'+post_name);
		console.log('postSelect:'+postSelect);
		var successMessae,errorMessae;
		req.flash('name',post_name);//For refresh users data

		if(postSelect == ""){//Delete mode
			UserDbTools.removeUserByName(post_name,function(err,result){
				if(err){
					console.log('removeUserByName :'+post_name+ " fail! \n" + err);
					errorMessae = err;
				}else{
					console.log('removeUserByName :'+post_name + 'success');
					successMessae = successMessae;
				}
				UserDbTools.findAllUsers(function (err,users){
					console.log('查詢到帳戶 :'+users.length);
				});
				//Jason add for user info in index on 2017.05.15
				var users = JsonFileTools.getJsonFromFile(userPath);
				var index = users.indexOf(post_name);
				if (index > -1) {
					users.splice(index, 1);
				}
				JsonFileTools.saveJsonToFile(userPath,users);

				req.flash('refresh','delete');//For refresh users data
				return res.redirect('/account');
			});

		}else{//Edit modej
			console.log('postSelect[0] :'+typeof(postSelect) );
			var arr = postSelect.split(",");
			var authz = {a01:arr[1],a02:arr[2],a03:arr[3],a04:arr[4],a05:arr[5],a06:arr[6]};
			if(arr[1]=='true'){
				authz.a01 = true;
			}else{
				authz.a01 = false;
			}
			if(arr[2]=='true'){
				authz.a02 = true;
			}else{
				authz.a02 = false;
			}
			if(arr[3]=='true'){
				authz.a03 = true;
			}else{
				authz.a03 = false;
			}
			if(arr[4]=='true'){
				authz.a04 = true;
			}else{
				authz.a04 = false;
			}
			if(arr[5]=='true'){
				authz.a05 = true;
			}else{
				authz.a05 = false;
			}
			if(arr[6]=='true'){
				authz.a06 = true;
			}else{
				authz.a06 = false;
			}
			var json = {enable:arr[0],authz:authz};

			console.log('updateUser json:'+json );

			UserDbTools.updateUser(post_name,json,function(err,result){
				if(err){
					console.log('updateUser :'+post_name + err);
					errorMessae = err;
				}else{
					console.log('updateUser :'+post_name + 'success');
					successMessae = successMessae;
				}
				req.flash('refresh','edit');//For refresh users data
				return res.redirect('/account');
			});
		}
  	});
  	app.get('/control', checkLogin);
    app.get('/control', function (req, res) {
    	var _max='',_min='';
    	var json = JsonFileTools.getJsonFromFile(ctrlPath);
    	if(json){
    		_max = json['max'];
    		_min = json['min'];
    	}
    	res.render('control', { title: 'Webduino控制',
			user:req.session.user,
			error: null,
			success: null,
			units:null,
			max:_max,
			min:_min
		});
    });

    app.post('/control', checkLogin);
  	app.post('/control', function (req, res) {
		var	post_max = req.body.max;
		var post_min = req.body.min;
		var json = {max:post_max,min:post_min};
		JsonFileTools.saveJsonToFile(ctrlPath,json);
		return res.redirect('/control');
	});
};

function checkLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '');
    res.redirect('/login');
  }else{
	  next();
  }
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    req.flash('error', '');
    res.redirect('back');
  }else{
	  next();
  }
}


//For save notify in edit notify
function changeNotify(max,min,maxInfo,minInfo,info){
	var keys = Object.keys(info.fieldName);
	var isNoSetting = true;

	if(info.notify === undefined){
		info.notify = {};
	}

	for(var i = 0;i<max.length;i++){

		if(info.notify[keys[i]] === undefined){
			info.notify[keys[i]] = {};
		}
		if(max[i] != '' ){
			isNoSetting =false;
			info.notify[keys[i]]['max'] = max[i];
			if(maxInfo[i] != '' ){
				info.notify[keys[i]]['maxInfo'] = maxInfo[i];
			}else {
				info.notify[keys[i]]['maxInfo'] = info.fieldName[keys[i]]+'超過最大值';
			}
		}else {
			if(info.notify[keys[i]]['max'] !== undefined){
				delete info.notify[keys[i]]['max'];
			}
			if(info.notify[keys[i]]['maxInfo'] !== undefined){
				delete info.notify[keys[i]]['maxInfo'];
			}

		}
		if(min[i] != '' ){
			isNoSetting = false;
			info.notify[keys[i]]['min'] = min[i];
			if(minInfo[i] != '' ){
				info.notify[keys[i]]['minInfo'] = minInfo[i];
			}else {
				info.notify[keys[i]]['minInfo'] = info.fieldName[keys[i]]+'低於最小值';
			}
		}else {
			if(info.notify[keys[i]]['min'] !== undefined){
				delete info.notify[keys[i]]['min'];
			}
			if(info.notify[keys[i]]['minInfo'] !== undefined){
				delete info.notify[keys[i]]['minInfo'];
			}
		}
		/*if(flag === false){//No setting then remove setting json
			delete info.notify[keys[i]];
		}*/
	}
	var keys2 = Object.keys(info.notify);
	if(isNoSetting){
		delete info.notify;
	}
	return info;
}

function getLogList(){
	var allLogs = JsonFileTools.getJsonFromFile(logPath);
	var arr = [];

	if(allLogs === null || allLogs === undefined){
		allLogs = {};
		JsonFileTools.saveJsonToFile(logPath,allLogs);
	}else{
		var keys = Object.keys(allLogs);
		
		for(var i = 0;i<keys.length;i++){
			if(allLogs[keys[i]]['subject']){
				var mArr = [];
				mArr.push(allLogs[keys[i]]['subject']);
				mArr.push(allLogs[keys[i]]['content']);
				mArr.push(allLogs[keys[i]]['createdTime']);
				arr.push(mArr);
			}
		}
	}
	return arr;
}



//For get notify list in index
function getNotifyList(){

	var allInfos = JsonFileTools.getJsonFromFile(infoPath);
	var keys = Object.keys(allInfos);
	var arr = [];
	var number = 0;

	for(var i = 0;i<keys.length;i++){
		if(allInfos[keys[i]]['notify']){
			var mArr = getNotify(allInfos[keys[i]]);
			number = number + mArr[0];
			arr.push(mArr[1]);
		}
	}
	return [number,arr];
}


//For get notify  in index
function getNotify(info){
	var json = {};
	var number = 0;
	json.typeName = info.typeName;
	json.notify = [];
	var keys = Object.keys(info.notify);
	for(var i = 0;i<keys.length;i++){
		if(info.notify[keys[i]]['max']){
			number++;
			if(info.notify[keys[i]]['maxInfo']){
				json.notify.push([info.fieldName[keys[i]]+'最大值',info.notify[keys[i]]['max'],info.notify[keys[i]]['maxInfo']]);
			}else{
				json.notify.push([info.fieldName[keys[i]]+'最大值',info.notify[keys[i]]['max'],'']);
			}
		}
		if(info.notify[keys[i]]['min']){
			number++;
			if(info.notify[keys[i]]['minInfo']){
				json.notify.push([info.fieldName[keys[i]]+'最小值',info.notify[keys[i]]['min'],info.notify[keys[i]]['minInfo']]);
			}else{
				json.notify.push([info.fieldName[keys[i]]+'最小值',info.notify[keys[i]]['min'],'']);
			}
		}
	}
	return [number,json];
}

function getDeviceList(units){

	var finalJson = JsonFileTools.getJsonFromFile(finalPath);
	var arr = [];
	for(var key in units){
		arr.push(getInfo(units[key],finalJson[units[key].macAddr]));
	}
	return arr;
}

function getInfo(unit,data){
	var arr = [];
	arr.push(unit.name);
	arr.push(unit.typeString);
	if(data){
		arr.push(data.date);
		var now = new Date();
		now = now.getTime();
		var mTimestamp = new Date(data.recv);
		mTimestamp = mTimestamp.getTime();
		var diff = (now - mTimestamp)/hour;
		console.log(unit.name+' : overtime ='+unit.overtime+' , diff = '+diff);
		if(data.information.voltage && data.information.voltage < 350){
			console.log(unit.name+' : voltage ='+data.information.voltage);
			arr.push('電量太低');
		}else if(diff<= unit.overtime ){
			arr.push('正常');
		}else{
			arr.push('失聯');
		}
	}else{
		arr.push('無');
		arr.push('未知');
	}
	return arr;
}

function saveUnit(mode,post_mac,post_name){
	var allunits = JsonFileTools.getJsonFromFile(unitPath);
	if(mode === 'del'){
		delete allunits[post_mac];
	}else{
		allunits[post_mac] = post_name;
	}
	JsonFileTools.saveJsonToFile(unitPath,allunits);
}

function toUpdateLogByTime(time){
	var json = {"type":"notify","createdTime":time};
	log.updateLogByTime(time,function(err,result){});
}

