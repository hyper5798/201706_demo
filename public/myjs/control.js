var relay;
var dht;
var host = window.location.hostname;
var port = window.location.port;


/*boardReady({device: 'kXz6'}, function (board) {
  board.systemReset();
  board.samplingInterval = 250;
  relay = getRelay(board, 11);
});*/

$(document).ready(function () {
		/*setTimeout(function(){
		    //do what you need here
		    document.getElementById('error_message').innerText = '';
		}, 3000);*/
	});



    /*var socket = io.connect();
	socket.on('connect',function(){
        socket.emit('control_client','hello,control_client socket cient is ready');
    });*/

	/*$("form").submit(function () {
	  	if(document.getElementById("mac").value.length != 8){
			alert('MAC字數須為8');
			return false;
		}else{
			$("#type_option").children().each(function(){
            	//alert('$(this).val() = '+  $(this).val() + ' -> '+$("#type_option").val());
			    if ($(this).val()==$("#type_option").val()){
			        //jQuery給法
			        $(this).attr("selected", "true"); //或是給"selected"也可
			        //alert(' $(this).text() : '+ $(this).text());
			        var typeString = document.getElementById("typeString");
            		typeString.value = $(this).text();
			        //javascript給法
			        this.selected = true;
	    		}
			});
		}
	});*/

if(location.protocol=="https:"){
    var wsUri="wss://"+host+":"+port+"/ws/control";
} else {
    var wsUri="ws://"+host+":"+port+"/ws/control";
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
        }else if(msg.id === 'init'){
            //Set init button active
            console.log("type:"+typeof(msg.v)+" = "+ msg.v);
            type = msg.v;
            }
        }
    }

    ws.onopen = function() {
        var obj = {"id":"init","v":"check valve setting"};
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

function openLigt(){
	//alert('openLigt');
	//socket.emit('control_client_setSwitch','on');
	//relay.on();
	var obj = {"id":"control","v":"open"};
    var objString = JSON.stringify(obj);
    console.log("ws.onopen : "+ objString);
    ws.send(objString);     // Request ui status from NR
    console.log("sent find WS");
}

function editCheck(button){
	//alert('test');

	var max_val = $('#max').val();
	var min_val = $('#min').val();
	//alert('max : '+max_val);
	//socket.emit('control_client_setTempLimit',{max:max_val,min:min_val});
	document.getElementById("editDevice").submit();
}

function closeLight(button){
	//alert('closeLight');
	//socket.emit('control_client_setSwitch','off');
	//relay.off();
	var obj = {"id":"control","v":"close"};
    var objString = JSON.stringify(obj);
    console.log("ws.onopen : "+ objString);
    ws.send(objString);     // Request ui status from NR
    console.log("sent find WS");
}