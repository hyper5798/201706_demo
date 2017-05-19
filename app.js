var debug = false;
var express = require('express');
var session = require('express-session');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var flash = require('connect-flash');
var settings = require('./settings');
var routes = require('./routes/index');
var todos = require('./routes/todos');//Jason add on 2016.09.26
var webhook = require('./routes/webhook');//Jason add on 2016.09.26
var moment = require('moment');
var http = require('http'),
    https = require('https');
var ssl = require('./sslLicense');
//Jason add for node-red on 2017.01.03
var RED = require("node-red");

var UnitDbTools = require('./models/unitDbTools.js');
var DeviceDbTools = require('./models/deviceDbTools.js');
var UserDbTools = require('./models/userDbTools.js');
//var GIotClient =  require('./models/gIotClient.js');
var tools =  require('./models/tools.js');
var JsonFileTools =  require('./models/jsonFileTools.js');
var schedule = require('node-schedule');
var async = require('async');
//Jason add for test
//var test =  require('./models/testTools.js');
//test.mqttTest();

//app setting-------------------------------------------------------
var app = express();
var port = process.env.PORT || 3000;
app.set('port', port);
//app.set('httpsport', 8080);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: settings.cookieSecret,
  key: settings.db,//cookie name
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
  resave: false,
  saveUninitialized: true
}));
//Jason add on 2016.09.26
app.use(express.static(path.join(__dirname, 'bower_components/jquery-validation/dist/')));
app.use(express.static(path.join(__dirname, 'bower_components/jquery-validation/src/')));

app.use('/todos', todos);
app.use('/webhook', webhook);
//
routes(app);
var server = http.createServer(app);
//var httpsServer = https.createServer(ssl.options, app).listen(app.get('httpsport'));


if(debug){
	console.log('#########  Debug Mode #############');
}
/*Note:
  All data from DB is initial in msgTools
*/ 

var redSettings = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/",
    userDir:"./.nodered/",
    functionGlobalContext: {
    	momentModule:require("moment"),
    	deviceDbTools:require("./models/deviceDbTools.js"),
		msgTools:require("./models/msgTools.js"),
		listeDbTools:require("./models/listDbTools.js"),
    	debug:debug,
		webduinoCtrl : require('./models/webduinoCtrl.js')
    }    // enables global context
};

// Initialise the runtime with a server and settings
RED.init(server,redSettings);

// Serve the editor UI from /red
app.use(redSettings.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(redSettings.httpNodeRoot,RED.httpNode);
//Jason modify on 2016.05.23
//app.use('/', routes);
//app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  res.render("404");
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

var max = 0,min =0;
var json = JsonFileTools.getJsonFromFile('./public/data/temp.json');
//console.log(typeof(json));
if(json != null){
	max = Number(json['max']);
	min =  Number(json['min']);
	switchBySetting(max,min);
}

var sock = require('socket.io').listen(server.listen(port));

//Jason add for node-red on 2017.01.03
// Start the runtime
RED.start();


/*app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});*/

console.log('settings.cookieSecret : '+settings.cookieSecret);
console.log('settings.db : '+settings.db);

var date = moment();

//macList is for unit type = 'aa00'
var myUnits,macList = [];
findUnitsMac();

sock.on('connection',function(client){

	//for new message ----------------------------------------------------------------------------
	client.on('new_message_client',function(id, data){

		UnitDbTools.findAllUnits(function(err,allUnits){
			if(err){
				console.log('Debug findAllUnits err:'+err);
			}else{
				myUnits = units;
				var units = [];
				//console.log('Debug new_message_client-> allUnits : '+allUnits);
				for(var i = 0;i<allUnits.length;i++){
					if(debug){
		  				console.log('Debug update -> check '+ allUnits[i].name +' type : '+ allUnits[i].type);
		  			}
		  			if(allUnits[i].type == 'aa00'){
		  				units.push(allUnits[i]);
		  			}
		  		}
				//console.log('Debug new_message_client-> units : '+units);
				console.log('Debug new_message_client ------------------------------------------------------------start' );
				for(var i=0;i<units.length;i++){
					var unit = units[i];
					if(debug){
						console.log('Debug new_message_client->unit : ('+i+') \n' + unit.macAddr );
					}
					var unitMac = unit.macAddr;

					DeviceDbTools.findLastDeviceByMac(unit.macAddr,function(err,device){
						if(err){

						}else{
							if(device){
								var index = 0;

								for(var j=0;j<units.length;j++){
									if(units[j].macAddr == device.macAddr){
										 index = j;
									}
								}
								if(device.index == 'aa00'){
									var message = {index:index,macAddr:device.macAddr,time:device.time,tmp1:device.info.temperature,hum1:device.info.humidity,vol:device.info.voltage};
									if(debug){
										//console.log('Debug new_message_client ->device ('+index+') :'+ JSON.stringify(device));
										console.log('Debug new_message_client -> message'+ JSON.stringify(message));
									}
									client.emit('new_message_db_findLast',message);
								}
								console.log('Debug new_message_client ------------------------------------------------------------end' );
							}
						}
					});
				}
			}
		});
	});

	client.on('disconnect',function(){
         console.log('Server has disconnected!');
	});

	client.on('new_message_test',function(data){
		client.emit('new_message_receive_mqtt','new_message_test');
	});

	//----------------------------------------------------------------------------
	client.on('chart_client',function(data){
		console.log('Debug cart_client ------------------------------------------------------------start' );
		console.log('Debug cart_client :'+data );
	});

	client.on('chart_client_find_db',function(data){
		console.log('Debug chart_client_find_db ----------------------------------------------------start' );
		console.log('Debug cart_client mac:'+data.mac +' , option:'+typeof(data.option)+' , date:'+typeof(data.date));
		DeviceDbTools.findDevicesByDate(data.date,data.mac,Number(data.option),'desc',function(err,devices){
			if(err){
				console.log('find name:'+find_mac);
				return;
			}

			/*Jason modify on 2016.11.01 for chart data process from server to client

			 if (devices.length>0) {
				console.log('Debug chart -> find '+devices.length+' records');
				var newDevices = devices;//getShortenDevices(devices);
				var timeJsonStr =JsonFileTools.saveDataAndGetTimeeString(data.option,newDevices);
				var timeJson = JSON.parse(timeJsonStr);
				console.log('Debug chart -> timeJsonStr : '+timeJsonStr);
				client.emit('chart_client_db_result',timeJson);
			}else{
				console.log('Debug find get -> can not find');
				client.emit('chart_client_db_result',null);
			}*/
			client.emit('chart_client_db_result',devices);
		});
	});

	client.on('disconnect', function () {
        console.log('???? socket disconnect id : ' +client.id);
    });
});


function switchBySetting(_max,_min){
	DeviceDbTools.findLastDeviceByMacIndex('040004b8','aa01',function(err,device){
		if(err){

		}else{
			if(device){
				console.log('Debug new_message_client ->device  :'+device);
				var temp = device.info.temperature;
			}
		}
	});
}




function getShortenDevices(devices){
	var interval = Math.floor(devices.length/145)+1;
	var newDevices=[];
	if(interval>1){
		for(var i=0;i<devices.length;i=i+interval){
			//console.log(devices[i]);
			newDevices.push(devices[i]);
		}
		return newDevices;
	}
	return devices;
}

function getType(p) {
	console.log('Debug getType :'+(typeof p))
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}



//for aa00 device (temprature/huminity) status
function findUnitsMac(){
	UnitDbTools.findAllUnits(function(err,units){
		if(err){
			errorMessae = err;
		}else{
			if(+units.length>0){
				for(var i=0;i<units.length;i++){
					//console.log( "unit :"+units[i] );
					if(units[i].macAddr && units[i].type == 'aa00'){
						console.log('mac ('+i+'):'+units[i].macAddr);
						macList.push(units[i].macAddr);
					}
				}
			}
		}
	});
}