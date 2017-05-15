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
var host = window.location.hostname;
var port = window.location.port;

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

var opt={"oLanguage":{"sProcessing":"處理中...",
        "sLengthMenu":"顯示 _MENU_ 項結果",
        "sZeroRecords":"沒有匹配結果",
        "sInfo":"顯示第 _START_ 至 _END_ 項結果，共 _TOTAL_ 項",
        "sInfoEmpty":"顯示第 0 至 0 項結果，共 0 項",
        "sInfoFiltered":"(從 _MAX_ 項結果過濾)",
        "sSearch":"搜索:",
        "oPaginate":{"sFirst":"首頁",
                    "sPrevious":"上頁",
                    "sNext":"下頁",
                    "sLast":"尾頁"}
        },dom: 'Blrtip',
        buttons: [
            'copyHtml5',
            //'excelHtml5',
            'csvHtml5',
            //'pdfHtml5'
        ],
        "order": [[ 3, "desc" ]],
        "iDisplayLength": 25
};
var table = $("#table1").dataTable(opt); //中文化
//$('#datepicker1').datepicker({dateFormat: 'yy-mm-dd', showOn: 'both',buttonImageOnly: true, buttonImage: 'images/calendar.png'});
$('#datepicker1').datepicker(opt);

if(location.protocol=="https:"){
    var wsUri="wss://"+host+":"+port+"/ws/find";
} else {
    var wsUri="ws://"+host+":"+port+"/ws/find";
}
var ws=null;

function wsConn() {
    ws = new WebSocket(wsUri);

    ws.onmessage = function(m) {
        //console.log('< from-node-red:',m.data);
        if (typeof(m.data) === "string" && m. data !== null){
        var msg =JSON.parse(m.data);
        console.log("from-node-red : id:"+msg.id);
        if(msg.id === 'change_table'){
            //Remove init button active
            console.log("v : "+msg.v);

            //Reload table data
            //console.log("v type:"+typeof(msg.v));
            table = $('#table1').dataTable();
            table.fnClearTable();
            var data = JSON.parse(msg.v);
            //console.log("addData type : "+ typeof(data)+" : "+data);
            if(data){
                table.fnAddData(data);
                /*table.$('tr').click(function() {
                var row=table.fnGetData(this);
                    toSecondTable(row[1]);
                });*/
            }
            waitingDialog.hide();
        }else if(msg.id === 'init_btn'){
            //Set init button active
            console.log("type:"+typeof(msg.v)+" = "+ msg.v);
            type = msg.v;
            }
        }
    }

    ws.onopen = function() {
        var obj = {"id":"init","v":"find client connection"};
        var getRequest = JSON.stringify(obj);
        console.log("getRequest type : "+ typeof(getRequest)+" : "+getRequest);
        console.log("ws.onopen : "+ getRequest);
        ws.send(getRequest);      // Request ui status from NR
        console.log(getRequest);

    }

    ws.onclose   = function()  {
        console.log('Node-RED connection closed: '+new Date().toUTCString());
        connected = false;
        ws = null;
    }

    ws.onerror  = function(){
        console.log("connection error");
    }
}

wsConn();

function find() {
    showDialog();
    var mac = document.getElementById("selected_mac").value;
    var option = document.getElementById("time_option").value;
    var date = document.getElementById("datepicker1").value;
    //alert('mac :'+mac +', option : '+option +' , data : '+date);
    if(ws){
        console.log("ws.onopen OK ");
    }
    var value = {};
    value['mac'] = mac;
    value['option'] = option;
    value['date'] = date;
    value['host'] = host;
    value['port'] = port;
    var mValue = JSON.stringify(value);
    //console.log("id type : "+ typeof(id)+" : "+id);
    var obj = {"id":"find","v":value};
    var objString = JSON.stringify(obj);
    //console.log("getRequest type : "+ typeof(objString)+" : "+objString);
    console.log("ws.onopen : "+ objString);
    ws.send(objString);     // Request ui status from NR
    console.log("sent find WS");
}

function showDialog(){
    //waitingDialog.show('Custom message', {dialogSize: 'sm', progressType: 'warning'});
    waitingDialog.show();
    setTimeout(function () {
            waitingDialog.hide();
        }, 3000);
}
