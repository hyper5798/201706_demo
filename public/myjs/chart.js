var opt={
    dayNames:["星期日","星期一","星期二","星期三","星期四","星期五","星期六"],
    dayNamesMin:["日","一","二","三","四","五","六"],
    monthNames:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
    monthNamesShort:["一月","二月","三月","四月","五月","六月","七月","八月","九月","十月","十一月","十二月"],
    prevText:"上月",
    nextText:"次月",
    weekHeader:"週",
    showMonthAfterYear:true,
    dateFormat:"yy-mm-dd",
    showOn: 'both',
    buttonImageOnly: true,
    buttonImage: 'images/calendar.png'
};
//$('#datepicker1').datepicker({dateFormat: 'yy-mm-dd', showOn: 'both',buttonImageOnly: true, buttonImage: 'images/calendar.png'});
//$('#datepicker1').datepicker(opt);
new Calendar({
    inputField: "datepicker1",
    dateFormat: "%Y/%m/%d",
    trigger: "BTN",
    bottomBar: true,
    weekNumbers: true,
    //showTime: 24,
    showTime    :false,
    onSelect: function() {this.hide();}
});

var socket = io.connect();
var myData;
var plot1,plot2;
var tatalTime = 0,interval = 1,x_number;
var formatStr = '%H:%M';


socket.on('connect',function(){
    socket.emit('chart_client','hello,chart socket cient is ready');
});

/*$('[name=time_option]').change(function() {
    $( "select option:selected" ).each(function() {
        //alert( $( this ).val() );
        if($( this ).val() == 0){
        interval = 60;//60*5 per 300 seconds
        }else if($( this ).val() == 1){
        interval = 12*60;//12*5*60 per 1 hours
        }else if($( this ).val() == 2){
        interval = 12*60;//12*5*60 per 1 hours
        }else{
        interval = 12*60;//24*5*60 per 1 hours
        }
    });
});*/

var options1 ={
                title: "溫度(℃)",
                axes:
                {
                    xaxis: {
                        numberTicks: 24,
                        renderer:$.jqplot.DateAxisRenderer,
                        tickOptions:{formatString:'%H:%M'}
                    },
                    yaxis: {
                        numberTicks: 10
                    }
                }
            };
var options2 ={
                title: "濕度(%)",
                axes:
                {
                    xaxis: {
                        numberTicks: 24,
                        renderer:$.jqplot.DateAxisRenderer,
                        tickOptions:{formatString:'%H:%M'}
                    },
                    yaxis: {
                        numberTicks: 10
                    }
                }
            };

socket.on('chart_client_db_result',function(data){
    //alert('option : '+data.option+'\ninterva : '+data.interval+'\nmin : '+data.min+'\nmax : '+data.max+'\nnumber : '+data.deviceNumber)
    // The url for our json data
    if(data == null){
        $('#chartTmp').empty();
        $('#chartHum').empty();
        alert('無法找到資料!');
        $("#chartBlock").hide();
        return;
    }

    //Jason add on 2016.11.01
    $("#chartBlock").show();
    var tempList = [],humList=[];
    //alert('data.length : '+data.length);
    for(i=0;i<data.length;i++){
        //alert('i : '+i);
        if(i > (data.length-1) ){
            break;
        }else{
            tempList.push([new Date(data[i].recv_at).getTime(),data[i].info.temperature]);
            humList.push([new Date(data[i].recv_at).getTime(),data[i].info.humidity]);
        }
    }
    tatalTime = Math.ceil((tempList[tempList.length-1][0]-tempList[0][0])/(1000*60*60))+1;
    //alert( tatalTime );
    if(tatalTime<12){
        x_number = tatalTime;
        formatStr = '%H:%M';
    }else if(tatalTime<26){
        x_number = tatalTime/2;
        formatStr = '%H:%M';
    }else if(tatalTime<24*7){
        x_number = Math.ceil(tatalTime/24);
        formatStr = '%m/%d';
    }else if(tatalTime<24*31){
        x_number = Math.ceil(tatalTime/(2*24));
        formatStr = '%m/%d';
    }else if(tatalTime<24*31*3){
        x_number = Math.ceil(tatalTime/(7*24));
        formatStr = '%m/%d';
    }


    if(plot1){
        plot1.destroy();
    }
    if(plot2){
        plot2.destroy();
    }


    options1.axes.xaxis.numberTicks = x_number;
    options2.axes.xaxis.numberTicks = x_number;
    options1.axes.xaxis.tickOptions.formatString = formatStr;
    options2.axes.xaxis.tickOptions.formatString = formatStr;
    plot1 = $.jqplot ('chartTmp', [tempList],options1);
    plot2 = $.jqplot ('chartHum', [humList],options2);
});

function find(){
    //Get select element for mac , time
    //alert($('#mac').val());

    var mac = $('[name=mac]').val();
    var option = $('[name=time_option]').val();
    var date = $('[name=datepicker1]').val();
    //alert('mac : '+mac);
    //alert('option : '+option);
    //alert('date : '+date);
    socket.emit('chart_client_find_db',{mac:mac,option:option,date:date});
}

$(document).ready(function () {
    setTimeout(function(){
        //do what you need here
        document.getElementById('error_message').innerText = '';
    }, 3000);
    $("#chartBlock").hide();
});
