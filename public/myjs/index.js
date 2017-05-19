console.log("Node admin Index information");
var connected = false;
var now = new Date();
var date = (now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate() );
var mac,option,date;
var host = window.location.hostname;
var port = window.location.port;
if(location.protocol=="https:"){
  var wsUri="wss://"+host+":"+port+"/ws/";
} else {
  var wsUri="ws://"+host+":"+port+"/ws/";
}
console.log(wsUri);
var ws=null;

function wsConn() {
  ws = new WebSocket(wsUri);
  ws.onmessage = function(m) {
    //console.log('< from-node-red:',m.data);
    if (typeof(m.data) === "string" && m. data !== null){
      var msg =JSON.parse(m.data);
      console.log("from-node-red : id:"+msg.id);
      
      if(msg.id === 'refresh' ){
          window.location.reload();
      }else if(msg.id === 'init_end'){
          //Set init button active
          console.log("Connection is OK");
      }
    }
  }
  ws.onopen = function() {
    var obj = {"id":"init"};
    var getRequest = JSON.stringify(obj);
    console.log("getRequest : "+ getRequest);
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