var deviceDbTools =  require('./deviceDbTools.js');
var JsonFileTools =  require('./jsonFileTools.js');
var UnitDbTools =  require('./unitDbTools.js');
var MsgTools =  require('./msgTools.js');

var recv = new Date();

exports.mqttTest = function () {
    var msgObj = {"id":"49a3c489-f574-4deb-bdc5-75ef824336de","macAddr":"04000496","data":"aa005709ba12a201f5","buff":"2017-02-13T04:38:06.287Z","recv":"2017-02-13T00:39:23.000Z","extra":{"gwip":"10.6.1.63","gwid":"00001c497b48dc07","repeater":"00000000ffffffff","systype":4,"rssi":-94,"snr":85}};
    //var msgObj = {"id":"641e95a2-df04-4f09-954a-412a7dfbe933","macAddr":"040004b8","data":"aa012003feffaf135000b7","buff":"2017-02-13T03:09:57.694Z","recv":"2017-02-13T03:09:57.000Z","extra":{"gwip":"134.208.228.18","gwid":"00001c497b431f8e","repeater":"00000000ffffffff","systype":4,"rssi":-107,"snr":12}};
    //var msgObj = {"id":"3b78deab-bf67-44bd-a243-7507cdbbf437","macAddr":"040004b8","data":"aa0221000903f7","buff":"2017-02-13T03:13:34.336Z","recv":"2017-02-13T03:13:34.000Z","extra":{"gwip":"134.208.228.18","gwid":"00001c497b431f8e","repeater":"00000000ffffffff","systype":4,"rssi":-109,"snr":14.5}};
    console.log('msgObj.recv : '+ msgObj.recv);
     
    //To determine whether the timeout
    if(MsgTools.parseMsg(msgObj) === null){
        return;
    }
    if(MsgTools.parseMsg(msgObj) === null){
        return;
    }
};
//var devices = dbTools.findByMac(mac);
//console.log('find '+devices.length+' records');
exports.dbtest = function (macAddress,data,recv,callback) {
    var name　 = '瓜棚下感應裝置';
    var choise = 3;
    var step = 0;//0 change device info, 1:delete no info device

    deviceDbTools.findAllDevices(function(err,devices){
        if(err){
            console.log(err);
        }
        for(var i = 0; i < devices.length; i++){
            
            if(devices[i].info == null){
                console.log('devices ('+i+'): '+devices[i]);
                console.log('info : '+devices[i].info);
                saveDevice(devices[i]);
            }else{
                console.log('devices with info ('+i+'): '+devices[i]);
            }
        }
    });
};

function saveDevice(device){
    console.log('mac : '+ device.macAddr);
    console.log('data : '+ device.data);
    console.log('recv_at : '+ device.recv_at);
    deviceDbTools.saveDevice(device.macAddr,device.data,device.recv_at,function(err,info){
        console.log('Debug save Device -----------------------------');
        if(err){
            console.log('Debug save Device fail : '+err);
            return;
        }
        console.log('Debug save Device success ');
        console.log('Debug info.voltage : '+info.data4);
    });
    delDeviceById(device._id);
}

function delDeviceById(_id){
    console.log('_id : '+ _id);
    deviceDbTools.removeDeviceById(_id,function(err,result){
        console.log('Debug remove Device By Id -----------------------------');
        if(err){
            console.log('Debug remove Device By Id fail : '+err);
        }
        console.log('Debug remove Device By Id success ');
    });
}