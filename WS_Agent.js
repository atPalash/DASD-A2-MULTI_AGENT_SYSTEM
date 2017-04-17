var mysql = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    port: 3306, //Port number to connect to for the DB.
    user     : 'root', //!!! NB !!! The user name you have assigned to work with the database.
    password : '123456', //!!! NB !!! The password you have assigned
    database : 'DASD' //!!! NB !!! The database you would like to connect.
});

var WS_Agent = function WS_Agent(name, capability, neighbour, port ) {
    this.name_ = name;
    this.capability_ = capability;
    this.neighbour_ = neighbour;
    this.port_ = port;
    this.hostname_ = "localhost";
};
WS_Agent.prototype.getName = function () {
    return this.name_;
};

WS_Agent.prototype.getCapability = function () {
    return this.capability_;
};

WS_Agent.prototype.runServer = function () {
    var express = require('express');
    var bodyParser = require('body-parser');
    var request = require('request');

    var port = this.port_;
    var hostname = this.hostname_;
    var WS = this.name_;
    var WSnum = parseInt(port.toString().substr(2,3));

    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    var currentStatus = "free";
    function setStatus(stat) {
        currentStatus = stat;
    }
    function getStatus() {
        return currentStatus;
    }

    function simRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify({destUrl:'http://hostname'}),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    var priority = false;
    function setPriority() {
        priority = true;
    }
    function resetPriority() {
        priority = false;
    }

    app.post('/'+WS+'notifs', function (req, res) {
        if (req.body.payload.PalletID == "undefined"){
            console.log("**********************************UNDEFINED PALLET ID*********************************************");
        }
        setTimeout(function(){
            var event = req.body.id;
            var sender = req.body.senderID;
            var WS_ID = "WS"+sender.substr(6,2);
            var pallet_id = req.body.payload.PalletID;

            if (pallet_id != -1) {
                console.log('pallet ' + pallet_id +' enters '+event,WS_ID);
                switch (event) {
                    case "Z1_Changed": {
                        if((getStatus() == "free")||(WS_ID=='WS1')){
                            setStatus("busy");
                            connection.query('SELECT * from pallet_info where pallet_id=  "' + pallet_id + '"  order by id desc limit 1 ', function (err, rows) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    var frame_path = rows[0].pallet_frame_path;
                                    var screen_path = rows[0].pallet_screen_path;
                                    var key_path = rows[0].pallet_key_path;
                                    var pallet_status = rows[0].pallet_status;

                                    if (pallet_status == 0 && WS_ID != "WS1"){
                                        setPriority();
                                        var url14 = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                        simRequest(url14);
                                    }
                                    else if(WS_ID == "WS1"){
                                        connection.query('UPDATE ws_stat SET ws1 = "busy"',function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                var url18 = 'http://localhost:3000/RTU/' + sender + '/services/TransZone12';
                                                simRequest(url18);
                                            }
                                        });
                                    }
                                    else if((pallet_status == 1 && (frame_path.indexOf(WS_ID)>-1))||
                                        (pallet_status == 2 && (screen_path.indexOf(WS_ID)>-1))||
                                        (pallet_status == 3 && (key_path.indexOf(WS_ID)>-1))) {
                                        var url1 = 'http://localhost:3000/RTU/' + sender + '/services/TransZone12';
                                        simRequest(url1);
                                    }
                                    else{
                                        //console.log('hi zone14'+pallet_id+WS_ID);
                                        var url2 = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                        simRequest(url2);
                                    }
                                }
                            });
                        }
                        else{
                            setPriority();
                            var url3 = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                            simRequest(url3);
                        }
                        break;
                    }
                    case "Z2_Changed": {
                        var url4 = 'http://localhost:3000/RTU/'+sender+'/services/TransZone23';
                        simRequest(url4);
                        break;
                    }
                    case "Z3_Changed": {
                        if (WS_ID == "WS1"){
                            global.pallet_id_z3 = req.body.payload.PalletID;
                        }
                        connection.query('SELECT * from pallet_info where pallet_id=  "' + pallet_id + '" order by id desc limit 1 ', function (err, rows) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                var frame_type = rows[0].frame_type;
                                var screen_type = rows[0].screen_type;
                                var keyboard_type = rows[0].keyboard_type;
                                var pallet_status = rows[0].pallet_status;

                                switch (pallet_status){
                                    case 0 : {
                                        var url5 = 'http://localhost:3000/RTU/SimROB1/services/LoadPaper';
                                        simRequest(url5);
                                        break;
                                    }
                                    case 1: {
                                        var url6 = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+frame_type;
                                        simRequest(url6);
                                        connection.query('UPDATE pallet_info SET pallet_status = "2" where pallet_id = "' + pallet_id + '" ',function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                //console.log(' The status of Pallet ' + pallet_id + ' Changed to 2');
                                            }
                                        });
                                        break;
                                    }
                                    case 2: {
                                        var url7 = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screen_type;
                                        simRequest(url7);
                                        connection.query('UPDATE pallet_info SET pallet_status = "3" where pallet_id = "' + pallet_id + '" ',function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                //console.log(' The status of Pallet ' + pallet_id + ' Changed to 3');
                                            }
                                        });
                                        break;
                                    }
                                    case 3: {
                                        var url8 = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyboard_type;
                                        simRequest(url8);
                                        connection.query('UPDATE pallet_info SET pallet_status = "4" where pallet_id = "' + pallet_id + '" ',function (err) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                //console.log(' The status of Pallet ' + pallet_id + ' Changed to 4');
                                            }
                                        });
                                        break;
                                    }
                                    default:{
                                        var url9 = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                                        simRequest(url9);
                                    }
                                }
                            }
                        });
                        break;
                    }
                    case "Z4_Changed": {
                        if ((WS_ID == "WS12") || (WS_ID == "WS6")) {
                            connection.query('SELECT * from ws_stat', function (err, rows) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    var WS7_stat = rows[0].WS7;
                                    var WS1_stat = rows[0].WS1;

                                    if ((WS1_stat == "free") &&(WS_ID == "WS12") ){
                                        var url32 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone45';
                                        simRequest(url32);
                                    }
                                    if((WS7_stat == "free")&&(WS_ID == "WS6") ){
                                        var url33 = 'http://localhost:3000/RTU/SimCNV6/services/TransZone45';
                                        simRequest(url33);
                                    }
                                }
                            });
                        }
                        else{
                            var url10 = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
                            simRequest(url10);
                            setTimeout(function () {
                                resetPriority();
                            },2700);
                        }
                        break;
                    }
                    case "Z5_Changed": {
                        if(WS_ID == "WS1"){
                            //console.log('z5 changed for ws1 and set to free');
                            connection.query('UPDATE ws_stat SET WS1 = "free"',function (err) {
                                if (err) {
                                    console.error(err);
                                }
                                else {
                                    //console.log(' The status of '+ WS_ID + ' changed to free');
                                }
                            });
                        }
                        else{
                            //console.log('else a5 changed');
                            setStatus("free");
                        }
                        break;
                    }
                    case "PaperLoaded":{
                        var url11 = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                        simRequest(url11);
                        connection.query('UPDATE pallet_info SET pallet_status = "1" where pallet_id = "' + pallet_id_z3 + '" ',function (err) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                //console.log(' The status of Pallet ' + pallet_id_z3 + ' Changed to 1');
                            }
                        });
                        break;
                    }
                    case "DrawEndExecution": {
                        var recipe = parseInt(req.body.payload.Recipe);
                        pallet_id = req.body.payload.PalletID;
                        //console.log(pallet_id,recipe);
                        switch (recipe) {
                            case 1:
                            case 2:
                            case 3: {
                                var frame_type = "done" + recipe;
                                connection.query('UPDATE pallet_info SET pallet_status = "2", frame_type = "' + frame_type + '" where pallet_id = "' + pallet_id + '" ', function (err, result) {
                                });
                                break;
                            }
                            case 4:
                            case 5:
                            case 6: {
                                var screen_type = "done" + recipe;
                                connection.query('UPDATE pallet_info SET pallet_status = "3", frame_type = "' + screen_type + '" where pallet_id = "' + pallet_id + '" ', function (err, result) {
                                });
                                break;
                            }
                            case 7:
                            case 8:
                            case 9: {
                                var key_type = "done" + recipe;
                                connection.query('UPDATE pallet_info SET pallet_status = "4", frame_type = "' + key_type + '" where pallet_id = "' + pallet_id + '" ', function (err, result) {
                                });
                                break;
                            }
                        }
                        connection.query('SELECT * from pallet_info where pallet_id=  "' + pallet_id + '" order by id desc limit 1 ', function (err, rows) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                var pallet_status = rows[0].pallet_status;
                                var screen_path = rows[0].pallet_screen_path;
                                var key_path = rows[0].pallet_key_path;
                                //console.log(pallet_status,screen_path,key_path);
                                switch (pallet_status) {
                                    case 2: {
                                        if (screen_path.indexOf(WS_ID) > -1) {
                                            var screenType = rows[0].screen_type;
                                            var url = 'http://localhost:3000/RTU/SimROB' + WSnum + '/services/Draw' + screenType;
                                            simRequest(url);
                                        }
                                        else {
                                            if ((WS_ID == "WS12") || (WS_ID == "WS6")) {
                                                connection.query('SELECT * from ws_stat', function (err, rows) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    else {
                                                        var WS7_stat = rows[0].WS7;
                                                        var WS1_stat = rows[0].WS1;

                                                        if ((WS1_stat == "free") &&(WS_ID == "WS12") ){
                                                            if(!priority){
                                                                var url321 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                                                                simRequest(url321);
                                                            }
                                                            else{
                                                                url321 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                                                                setTimeout(function () {
                                                                    simRequest(url321);
                                                                },4700);
                                                            }
                                                        }
                                                        if((WS7_stat == "free")&&(WS_ID == "WS6") ){
                                                            if(!priority){
                                                                url321 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                                                                simRequest(url321);
                                                            }
                                                            else{
                                                                url321 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                                                                setTimeout(function () {
                                                                    simRequest(url321);
                                                                },4700);
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                            else{
                                                if(!priority){
                                                    var url100 = 'http://localhost:3000/RTU/SimCNV' + WSnum + '/services/TransZone35';
                                                    simRequest(url100);
                                                }
                                                else{
                                                    setTimeout(function () {
                                                        var url100 = 'http://localhost:3000/RTU/SimCNV' + WSnum + '/services/TransZone35';
                                                        simRequest(url100);
                                                    },4700)
                                                }
                                            }
                                        }
                                        break;
                                    }
                                    case 3: {
                                        if (key_path.indexOf(WS_ID) > -1) {
                                            var keyType = rows[0].keyboard_type;
                                            url = 'http://localhost:3000/RTU/SimROB' + WSnum + '/services/Draw' + keyType;
                                            simRequest(url);
                                        }
                                        else {
                                            if ((WS_ID == "WS12") || (WS_ID == "WS6")) {
                                                connection.query('SELECT * from ws_stat', function (err, rows) {
                                                    if (err) {
                                                        console.error(err);
                                                    }
                                                    else {
                                                        var WS7_stat = rows[0].WS7;
                                                        var WS1_stat = rows[0].WS1;

                                                        if ((WS1_stat == "free") &&(WS_ID == "WS12") ){
                                                            var url42 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                                                            simRequest(url42);
                                                        }
                                                        if((WS7_stat == "free")&&(WS_ID == "WS6") ){
                                                            var url103 = 'http://localhost:3000/RTU/SimCNV6/services/TransZone35';
                                                            simRequest(url103);
                                                        }
                                                    }
                                                });
                                            }
                                            else{
                                                if(!priority){
                                                    url100 = 'http://localhost:3000/RTU/SimCNV' + WSnum + '/services/TransZone35';
                                                    simRequest(url100);
                                                }
                                                else{
                                                    setTimeout(function () {
                                                        var url100 = 'http://localhost:3000/RTU/SimCNV' + WSnum + '/services/TransZone35';
                                                        simRequest(url100);
                                                    },4700)
                                                }
                                            }
                                        }
                                        break;
                                    }
                                    default: {
                                        if ((WS_ID == "WS12") || (WS_ID == "WS6")) {
                                            connection.query('SELECT * from ws_stat', function (err, rows) {
                                                if (err) {
                                                    console.error(err);
                                                }
                                                else {
                                                    var WS7_stat = rows[0].WS7;
                                                    var WS1_stat = rows[0].WS1;

                                                    if ((WS1_stat == "free") &&(WS_ID == "WS12") ){
                                                        var url421 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                                                        simRequest(url421);
                                                    }
                                                    if((WS7_stat == "free")&&(WS_ID == "WS6") ){
                                                        var url99 = 'http://localhost:3000/RTU/SimCNV6/services/TransZone35';
                                                        simRequest(url99);
                                                    }
                                                }
                                            });
                                        }
                                        else{
                                            if(!priority){
                                                url100 = 'http://localhost:3000/RTU/SimCNV' + WSnum + '/services/TransZone35';
                                                simRequest(url100);
                                            }
                                            else{
                                                setTimeout(function () {
                                                    var url100 = 'http://localhost:3000/RTU/SimCNV' + WSnum + '/services/TransZone35';
                                                    simRequest(url100);
                                                },4700)
                                            }
                                        }
                                    }
                                }
                            }
                        });
                        break;
                    }
                    default:{
                        res.end("ERROR");
                    }
                }
            }
            else {
                if ((event == "Z5_Changed")&&(WS_ID == "WS1")) {
                    var ur76 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone45';
                    simRequest(ur76);
                    var ur77 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone14';
                    simRequest(ur77);
                    var ur78 = 'http://localhost:3000/RTU/SimCNV12/services/TransZone35';
                    simRequest(ur78);
                }
            }

            res.end();
        },10);

    });


    if (port!=4001){
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/services/ChangePen'+this.capability_,{form:{destUrl:"http://localhost"}}, function(err,httpResponse,body){});
    }
    else{
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});

    }

    app.listen(port, hostname, function(){
        console.log(WS+`Server running at http://${hostname}:${port}/`);
    });
};

module.exports = WS_Agent;

