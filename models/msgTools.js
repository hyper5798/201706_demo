var moment = require('moment');
var ParseBlaziong =  require('./parseBlaziong.js');
var ParseDefine =  require('./parseDefine.js');
var JsonFileTools =  require('./jsonFileTools.js');
var listDbTools =  require('./listDbTools.js');
var settings =  require('../settings.js');
var debug = settings.debug;
var deviceDbTools =  require('./deviceDbTools.js');
var mData,mMac,mRecv,mDate,mTimestamp,mType,mExtra ;
var obj;
var overtime = 24;
var hour = 60*60*1000;
var isNeedGWMac = settings.isNeedGWMac;//For blazing
//Save data to file path
var finalPath = './public/data/finalList.json';


//Save data
var finalList = {};
var type_tag_map = {};//For filter repeater message key:mac+type value:tag

function init(){
    //finalList = JsonFileTools.getJsonFromFile(path);
    listDbTools.findByName('finalList',function(err,lists){
        if(err)
            return;
        console.log('lists[0] :\n'+JSON.stringify(lists[0]));
        finalList = lists[0].list;
        saveFinalListToFile();
    });
}

init();

exports.parseMsg = function (msg) {
    console.log('MQTT message :\n'+JSON.stringify(msg));
    try {
			obj = JSON.parse(msg.toString());
		}
		catch (e) {
			console.log('msgTools parse json error message #### drop :'+e.toString());
			return null;
		}
    //Get data attributes
    mData = obj.data;
    mType = mData.substring(0,4);
    mMac  = obj.macAddr;
    mDate = moment(mRecv).format('YYYY/MM/DD HH:mm:ss');
    mExtra = obj.extra;
    if(obj.recv){
        mRecv = obj.recv;
    }else
    {
        mRecv = obj.time;
    }
    mTimestamp = new Date(mRecv).getTime();

    //Parse data
    /*Remark blazing
    if(mExtra.fport>0 ){
        mInfo = parseBlazingMessage(mData,mExtra.fport);
    }else{*/
        if(isSameTagCheck(mType,mMac,mRecv))
            return null;
        if(mType.indexOf('aa')!=-1)
            mInfo = parseDefineMessage(mData,mType);
    //}

    var msg = {mac:mMac,type:mType,data:mData,recv:mRecv,date:mDate,extra:mExtra,timestamp:mTimestamp};
    /*if(mExtra.fport>0 ){
        saveBlazingList(mExtra.fport,mMac,msg)
    }else{*/
        finalList[mMac]=msg;
    //}


    if(mInfo){
        console.log('**** '+msg.date +' mac:'+msg.mac+' => data:'+msg.data+'\ninfo:'+JSON.stringify(mInfo));
        msg.information=mInfo;
    }

    saveToDB(msg,finalList);
    saveFinalListToFile();

    return msg;
}

function saveToDB(obj,list){
    
    listDbTools.updateList('finalList',list,function(err,info){
        if(err){
            console.log("supdateList Error :"+saveDeviceMsg);
        }
        console.log("updateList :"+info);
    });

    deviceDbTools.saveDeviceMsg(obj,function(err,info){
        if(err){
            console.log("saveDeviceMsg Error :"+saveDeviceMsg);
        }
        console.log("saveDeviceMsg :"+info);
    });
}

exports.setFinalList = function (list) {
    finalList = list;
}

exports.getFinalList = function () {
    return finalList;
}

function saveFinalListToFile() {
    /*var json = JSON.stringify(finalList);
    fs.writeFile(finalPath, json, 'utf8');*/
    JsonFileTools.saveJsonToFile(finalPath,finalList);
}
exports.saveFinalListToFile = saveFinalListToFile;

exports.getDevicesData = function (devices) {
    var array = [];

    if(devices){
        for (var i=0;i<devices.length;i++)
        {
            if(i==5){
              console.log( '#### '+devices[i].mac + ': ' + JSON.stringify(devices[i]) );
            }
            array.push(getArray(devices[i],i));
        }
    }

    var dataString = JSON.stringify(array);
    if(array.length===0){
        dataString = null;
    }
    return dataString;
};




exports.getFinalData = function (finalist) {
    var mItem = 1;
    var array = [];
    if(finalist){

        //console.log( 'Last Device Information \n '+JSON.stringify( mObj));

        for (var mac in finalist)
        {
            //console.log( '#### '+mac + ': ' + JSON.stringify(finalist[mac]) );

            array.push(getFinalArray(finalist[mac],mItem));
            mItem++;
        }
    }

    var dataString = JSON.stringify(array);
    if(array.length===0){
        dataString = null;
    }
    return dataString;
};

function getArray(obj,item){

    var index = obj.index;
    if(index === undefined){
        index = obj.data.substring(0,4);;
    }
    if(debug){
        console.log('getArray start ------------------------------');
        console.log('obj :'+JSON.stringify(obj));
        console.log('index :'+index);
    }
    var arr = [];
    /*if(item<10){
        arr.push('0'+item);
    }else{
        arr.push(item.toString());
    }*/

    if(index === 'aa00'){
        arr.push(obj.info.temperature);
        arr.push(obj.info.humidity);
        if( obj.info.voltage < 350){
            arr.push(low_power(obj.info.voltage));
        }else{
            arr.push(normal(obj.info.voltage));
        }
        //arr.push(obj.info.voltage);
    }else if(index === 'aa01'){
        arr.push(obj.information.pressure);
        arr.push(obj.info.temperature);
        arr.push(obj.info.humidity);
        arr.push(obj.information.light);
        arr.push(obj.info.uv);
        arr.push(obj.info.rain);
    }

    arr.push(obj.time);
    if(debug){
         console.log('arr = '+arr.length + '\n'+JSON.stringify(arr));
    }
    return arr ;
}

function normal(v){
    var normal = '<button type="button" class="btn btn-success btn-sm" >'+v+'</button>';
    return normal;
}

function low_power(v){
    var low_power = '<button type="button" class="btn btn-danger btn-sm" >'+v+'</button>';
    return low_power;
}



function getType(p) {
    if (Array.isArray(p)) return 'array';
    else if (typeof p == 'string') return 'string';
    else if (p != null && typeof p == 'object') return 'object';
    else return 'other';
}

function parseDefineMessage(data){
   var mInfo = ParseDefine.getInformation(data);
   return mInfo;
}

function parseBlazingMessage(data,fport){
    var mInfo = {};

    //for blazing
    if(fport === 3 || fport === 1){//GPS
        mInfo = ParseBlaziong.getTracker(data);
    }else if(fport === 19){//PIR
        mInfo = ParseBlaziong.getPIR(data);
    }else if(fport === 11){//PM2.5
        mInfo = ParseBlaziong.getPM25(data);
    }else if(fport === 21){//Flood
        mInfo = ParseBlaziong.getFlood(data);
    }
    return mInfo;
}

//type_tag_map is local JSON object
function isSameTagCheck(type,mac,recv){
	var time =  moment(recv).format('mm');

	//Get number of tag
	var tmp = mData.substring(4,6);
	var mTag = parseInt(tmp,16)*100;//流水號:百位
        mTag = mTag + parseInt(time,10);//分鐘:10位及個位
	var key = mac.concat(type);
	var tag = type_tag_map[key];

	if(tag === undefined){
		tag = 0;
	}

	/* Fix 時間進位問題
		example : time 由59分進到00分時絕對值差為59
	*/
	if (Math.abs(tag - mTag)<2 || Math.abs(tag - mTag)==59){
		console.log('mTag=' +mTag+'(key:' +key + '):tag='+tag+' #### drop');
		return true;
	}else{
		type_tag_map[key] = mTag;
		console.log('**** mTag=' +mTag+'(key:' +key + '):tag='+tag +'=>'+mTag+' @@@@ save' );
		return false;
	}
}