var webduino = require('webduino-js');
var ctrlPath = './public/data/ctrl.json';
var finalPath = './public/data/finalList.json';
var JsonFileTools =  require('./jsonFileTools.js');
var board, led;
var relay,pin;

function init(){
	board = new webduino.WebArduino('kXz6');
}

init();

board.on('ready', function() {
  //led = new webduino.module.Led(board, board.getDigitalPin(10));
  //led.on();
  pin = board.getDigitalPin(11);
  
  relay = new webduino.module.Relay(board, board.getDigitalPin(11));
  //realy.on();
  //console.log('relay state:'+realay.read());
});

function autoCtrl(info){
    var  ctrlSet = JsonFileTools.getJsonFromFile(ctrlPath);
    if(ctrlSet.max && info.humidity > ctrlSet.max && relay){
        relay.off();
    }

    if(ctrlSet.min && info.humidity < ctrlSet.min && relay){
        relay.on();
    }
}

function valveCtrl(){
    var  finalList = JsonFileTools.getJsonFromFile(finalPath);
    var  ctrlSet = JsonFileTools.getJsonFromFile(ctrlPath);
    if(ctrlSet === undefined || ctrlSet === null || Object.keys(ctrlSet).length === 0 ){
        return null;
    }
    
    var keys = Object.keys(finalList);
    var object;
    for(var i in keys){
        object = finalList[keys[i]];
        if(object.type === 'aa01'){
            break;
        }
    }
    
    return getValveControl(object,ctrlSet);
}

function getValveControl(data,set){
    if(data.information.humidity > set.max){
         relay.off();
    }

    if(data.information.humidity < set.min){
         relay.on();
    }
}


function relayOn() {
    relay.on();
}

function relayOff() {
    relay.off();
}

exports.init = init;
exports.relayOn = relayOn;
exports.relayOff = relayOff;
exports.autoCtrl = autoCtrl;
exports.valveCtrl = valveCtrl;


exports.state = function () {
    return 'onValue: '+relay._onValue +', offValue: '+relay._offValue;
}
