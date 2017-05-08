var ListModel = require('./list.js');

var moment = require('moment');


exports.saveList = function (name,list,callback) {
    return toSaveList(name,list,callback);
};

exports.updateList = function (name,list,callback) {
    return toUpdateList(name,list,callback);
};

exports.findByName = function (find_name,callback) {
    return toFindByName(find_name,callback); 
};


function toSaveList(name,list,callback){
    var now = moment().toDate();
    //console.log(now + ' Debug : saveDeviceMsg obj:'+JSON.stringify(list));

    var newList = new ListModel({     
        name     : name,
        recv     : new Date(),
        list     : list
    });

    //console.log('$$$$ DeviceModel : '+JSON.stringify(newDevice));

    newList.save(function(err){
        if(err){
            return callback(err);
        }else{
            return callback(err,"OK");
        }
    });
}

function toFindByName(find_name,callback){
    if(find_name.length>0){
            //console.log('find_mac.length>0');
            ListModel.find({ name: find_name }, function(err,lists){
                if(err){
                    return callback(err);
                }
                var now = moment().format('YYYY-MM-DD HH:mm:ss');
                //console.log("find all of name "+find_name+" : "+lists);
                /*lists.forEach(function(list) {
                    console.log('name:'+list.name + ', data :' +list.list);
                });*/

                if (lists.length>0) {
                    console.log(now+' findByName() : '+lists.length+' records');
                    return callback(err,lists);
                }else{
                    console.log('找不到資料!');
                    return callback('找不到資料!');
                }
            });
    }else{
        console.log('find_name.length=0');
        return callback('找不到資料!');
    }
}

function toUpdateList(find_name,list,callback) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Debug : toUpdateUint()');
    console.log('Debug : update list name='+find_name);

	if(find_name){
		toFindByName(find_name,function(err,lists){
            if(err){
                if(err = '找不到資料'){
                    toSaveList(find_name,list,function(err,result){
                        if(err){
                            return callback(err);
                        }else{
                            return callback(err,result);
                        }
                    });
                    
                }else{
                    console.log('Debug : update list to find list by name =>'+err);
                    return callback(err);
                }	
            }else{
                var JSON = { recv:new Date()};

                if(lists && lists.length>0){
                    if(list){
                        JSON.list = list;
                    }
                    
                    var listId = lists[0]._id;
                    //console.log('Debug : getListId list ' + lists[0]);
                    //console.log('Debug : getListId : ' + listId);
                    ListModel.update({_id : listId},
                        JSON,
                        {safe : true, upsert : true},
                        (err, rawResponse)=>{
                            if (err) {
                                console.log('Debug : update list : '+ err);
                                return callback(err);
                            } else {
                                console.log('Debug : update list : success');
                                return callback(err,'success');
                            }
                        }
                    );
		}else{
            toSaveList(name,list,function(err,result){
                        if(err){
                            return callback(err);
                        }else{
                            return callback(err,result);
                        }
                    });
                }
            }
        });
        
	}else{
		console.log('Debug : update list no reerance');
        return callback('Referance nul!');
	}
}