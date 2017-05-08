//var DeviceModel = require('./device.js');
var UnitModel = require('./unit.js');
var moment = require('moment');

exports.saveUnit = function (macAddress,name,type,typeString,callback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : saveUnit()');
	var time = {
		date   : moment().format("YYYY-MM-DD HH:mm:ss"),
		year   : moment().format("YYYY"),
		month  : moment().format("YYYY-MM"),
		day    : moment().format("YYYY-MM-DD"),
		hour   : moment().format("YYYY-MM-DD HH"),
		minute : moment().format("YYYY-MM HH:mm"),
		cdate   : moment().format("YYYY-MM HH:mm")
	};

	console.log('Debug save Unit: time.date'+time.date);
	var newUnit = new UnitModel({
		type       : type,
		typeString : typeString,
  		macAddr    : macAddress,
  		name       : name,
		status     : 0,
		update_at  : time,
		created_at : new Date()
	});
    newUnit.save(function(err){
		if(err){
			console.log('Debug : Unit save fail!/n'+err);
            return callback(err);
		}
		console.log('Debug : Unit save success!');
        return callback(err,'success');
	});
};

function toUpdateUint(type,find_mac,name,status,typeString,calllback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : toUpdateUint()');
    console.log('Debug : update Unit mac='+find_mac+" , name ="+name);
	var time = {
		date   : moment().format("YYYY-MM-DD HH:mm:ss"),
		year   : moment().format("YYYY"),
		month  : moment().format("YYYY-MM"),
		day    : moment().format("YYYY-MM-DD"),
		hour   : moment().format("YYYY-MM-DD HH"),
		minute : moment().format("YYYY-MM HH:mm"),
	};
	console.log('Debug update Unit: time.date'+time.date);
	if(find_mac){
		UnitModel.find({ macAddr: find_mac },function(err,units){
		if(err){
			console.log('Debug : update Unit find unit by mac =>'+err);
			return calllback(err);
		}
		var JSON = { update_at:time};

		if(units.length>0){
			if(name){
				//console.log('units[0].name : '+units[0].name);
				if(units[0].name ==null || units[0].name != name){
					JSON.name = name;
				}
			}
			if(type){
				//console.log('units[0].type : '+units[0].type);
				if(units[0].type ==null || units[0].type != type){
					JSON.type = type;
				}
			}
			if(status != null ){
				console.log('units[0].name : '+units[0].name);
				JSON.status = status;
			}
			if(typeString){
				console.log('units[0].name : '+units[0].name);
				JSON.typeString = typeString;
			}
			var unitId = units[0]._id;
			//console.log('Debug : getUnitId device ' + units);
			//console.log('Debug : getUnitId : ' +unitId);
        	UnitModel.update({_id : unitId},
	        	JSON,
	        	{safe : true, upsert : true},
	        	(err, rawResponse)=>{
 		        	if (err) {
                        console.log('Debug : update Unit : '+ err);
                        return calllback(err);
		        	} else {
                        console.log('Debug : update Unit : success');
			            return calllback(err,'success');
		            }
	            }
            );
		}else{
			console.log('Debug : update Unit can not find unit!');
			return calllback('Can not find unit!');
		}
	});
	}else{
		console.log('Debug : update Unit no reerance');
        return calllback('Referance nul!');
	}
}

/*
*Update unit status
*/
exports.updateUnitStatus = function (mac,status,calllback) {
    return toUpdateUint(null,mac,null,status,null,calllback);
};

/*
*Update unit name
*/
exports.updateUnitName = function (mac,name,calllback) {
    return toUpdateUint(null,mac,name,null,null,calllback);
};

/*
*Update unit name,date,type,status
*/
exports.updateUnit = function (type,find_mac,name,status,typeString,calllback) {
    return toUpdateUint(type,find_mac,name,status,typeString,calllback);
};

/*
*Remove all of unit
*Return -1:資�?存�??�誤 0:?�除完�? 1:?�除失�?
*/
exports.removeAllUnits = function (calllback) {
    UnitModel.remove({}, (err)=>{
	    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : removeAllUnits()');
	    if (err) {
		    console.log('Debug : Unit remove all occur a error:', err);
            return calllback(err);
	    } else {
		    console.log('Debug : Unit remove all success.');
            return calllback(err,'success');
	    }
    });
};

exports.removeUnitByMac = function (mac,calllback) {
    UnitModel.remove({macAddr:mac}, (err)=>{
	    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : removeUnitByMac()');
	    if (err) {
		    console.log('Debug : Unit remove mac :'+mac+' occur a error:', err);
            return calllback(err);
	    } else {
		    console.log('Debug : Unit remove mac :'+mac+' success.');
            return calllback(err,'success');
	    }
    });
};

/*Find all of unit
*/
exports.findAllUnits = function (calllback) {
    UnitModel.find((err, units) => {
	    if (err) {
		    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+'Debug : findAllUnits err:', err);
            return calllback(err);
	    } else {
            console.log(moment().format('YYYY-MM-DD HH:mm:ss')+'Debug : findAllUnits success\n:',units.length);
		    return calllback(err,units);
	    }
    });
};

exports.findByMac = function (mac,calllback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug unitDbTools : findByMac()');
    UnitModel.find({ macAddr: mac }, function(err,units){
		if(err){
			return callback(err);
		}
		if (units.length>0) {
			console.log('find '+units.length+' units');
			return calllback(err,units[0]);
		}else{
			console.log('資料庫無資料');
			return calllback(err,units);
		}
    });
};

