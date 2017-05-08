var aa00Data = { 'temperature':[6,10,100], 'humidity':[10,14,100], 'voltage':[14,18,1] };
var aa01Data = { 'pressure':[6,10,1],'hight':[10,14,1],'temperature':[14,16,1], 'humidity':[16,18,1], 'light':[18,22,1] ,'uv':[22,26,1],'rain':[26,30,1]};


exports.getInformation = function (data) { 
    
    var type = data.substring(0,4);
    
    return getTypeData(data,type);

};

function getTypeData(data,type){
    var info = {};
    
    if(type==='aa00'){
        var obj = aa00Data;
    }else if(type==='aa01'){
        var obj = aa01Data;
    }else if(type==='aa02'){
        var obj = aa02Data;
    }
    var keys = Object.keys(obj);
    var count = keys.length;

    /*var mPressure = data.substring(6,10);
    var mHight = data.substring(10,14);    　//氣壓
    var mTemperature = data.substring(14,16);   //溫度
    var mHumidity = data.substring(16,18);      //濕度
    var mLight = data.substring(18,22);         //照明
    console.log('mPressure : '+mPressure);
    console.log('mHight : '+mHight);
    console.log('mTemperature : '+mTemperature);
    console.log('mHumidity : '+mHumidity);
    console.log('mLight : '+mLight);
    console.log( 'obj : '+ JSON.stringify(obj) );
    console.log( 'keys : '+ JSON.stringify(keys) );*/
    for(var i =0;i<count;i++){
        //console.log( keys[i]+' : '+ obj[keys[i]]);
        if(keys[i] === 'rain'){
            info[ keys[i] ] = 1023-getIntData(obj[keys[i]],data);
        }else{
            info[ keys[i] ] = getIntData(obj[keys[i]],data);
        }
    }
    return info;
}

function getIntData(arrRange,data){
    var ret = {};
    var start = arrRange[0];
    var end = arrRange[1];
    var diff = arrRange[2];
    var intData = parseInt(data.substring(start,end),16);
    if(diff === 1)
        return intData;
    else
        return intData/diff;
}