//Parse data ------------------------------------start
exports.getTracker = function (raw) {

    if (raw.length !== 34)  {
        //console.log('Not a tracker data :'+msg.payload.mac);
        return null;
    }
    var buff = new Buffer(raw, 'hex');
    var CustomerID = buff[0];
    var ProductID = buff[1];
    var DeviceType = buff[2];
    var report = buff[3] & 0x1F   // 0x10 : report ; 0x11 : panic ; 0x12 : alarm
    var operationID = buff[3] & 0x40  // 0x40 : auto-send

    var gps_sta = (buff[7] & 0x80) ? "1" : "0";

    /* latitude */
    var north_flag = (buff[7] & 0x40) ? 1 : -1;

    buff[7] &= 0x3F;
    var lat = buff.readUInt32LE(4),
        lat_degree = Math.floor(lat / 10000000),
        lat_remainder = (lat % 10000000)/(60*100000);

    lat = lat_degree + lat_remainder;
    if(lat !== 0) {
        lat *= north_flag;
    }
    /* longitude */
    var east_flag = (buff[11] & 0x80) ? 1 : -1;
    buff[11] &= 0x7F;
    var lng = buff.readUInt32LE(8),
        lng_degree = Math.floor(lng / 10000000),
        lng_remainder = (lng % 10000000)/(60*100000);
    lng = lng_degree + lng_remainder;
    if(lng !== 0) {
        lng *= east_flag;
    }

    /* GPS time */
    var gps_day = ((buff[14] >> 2) & 0x1F).toString();
    buff[14] &= 0x03;
    var gps_time = (buff.readUInt32LE(12) & 0x3FFFF).toString();
    if(gps_time.length === 5) {
        gps_time = "0" + gps_time;
    }

    var ret = {
        CustomerID : CustomerID,
        ProductID  : ProductID,
        DeviceType : DeviceType,
        report     : report,
        operationID: operationID,
        GPS_STA    : gps_sta,
        GPS_N      : lat,
        GPS_E      : lng,
        gps_day    : gps_day,
        gps_time   : gps_time
    };

    if(report === 0x11) {
        var panic_flag = (buff[16] & 0x01).toString();
        ret.panic_flag = panic_flag;
    }
    else {
        /* battery */
        var battery = ( buff[16] * 10 + 3000 ) / 1000;
        ret.BATL = battery.toString();
    }

    return ret;
};

exports.getPIR = function (raw) {

    if (raw.length !== 14)  {
        //node.warn('Not a PIR data');
        return null;
    }
    var buff = new Buffer(raw, 'hex');
    var trigger = (buff[6] & 0x02) ? "1" : "0";  //PB7

    var ret = {
        trigger      : trigger/*,
        BATL : batteryLevel*/
    };

    return ret;
};

exports.getPM25 = function (raw) {

    if (raw.length !== 10)  {
        //node.warn('Not a PM2.5 data');
        return null;
    }
    var buff = new Buffer(raw, 'hex');
    var value = (buff[1]*256 + buff[2])/1024*5*900;
    var batteryLevel = (buff[0] * (83/56) / 10).toString();

    var ret = {
        value        : value,
        BATL : batteryLevel
    };

    return ret;
};

exports.getFlood = function (raw) {

   if (raw.length !== 14)  {
        //node.warn('Not a Flood data');
        return null;
    }
    var buff = new Buffer(raw, 'hex');
    //var batteryLevel = (buff[1] / 10 ).toString();
    var batteryLevel = (buff.readUInt16BE(2) * (83/56) / 10).toString();
    var trigger = (buff[6] & 0x02) ? "1" : "0";

    var ret = {
        trigger      : trigger,
        BATL : batteryLevel
    };

    return ret;
};


//Parse data ------------------------------------end