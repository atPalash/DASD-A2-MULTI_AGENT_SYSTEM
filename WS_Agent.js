/**
 * Created by halder on 09-Apr-17.
 */
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');
var Pallet_Agent = require('./Pallet_Agent');
var app = require('./app');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var currentPallet;
function setPallet(pallet) {
    currentPallet = pallet;
    //console.log(currentPallet);
}
function resetPallet() {
    currentPallet = 0;
}
function getPallet() {
    return currentPallet;
}
function simRequest(url) {
    request({
        url: url,
        method: "POST",
        body: JSON.stringify({destUrl:'http://hostname'}),
        headers:{'Content-Type':'application/json'}
    },function (err, res, body) {});
}
function palletRequest(url) {
    request({
        url: url,
        method: "POST",
        body: JSON.stringify(getPallet()),
        headers:{'Content-Type':'application/json'}
    },function (err, res, body) {});
}
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

WS_Agent.prototype.getNeighbour = function () {
    return this.neighbour_;
};

WS_Agent.prototype.getPort = function () {
    return this.port_;
};

WS_Agent.prototype.getURL = function () {
    return this.url_;
};

WS_Agent.prototype.runServer = function () {
    var port = this.port_;
    var hostname = this.hostname_;
    var WS = this.name_;
    var WSnum = parseInt(port.toString().substr(2,3));
    var WS_Neighbour = this.neighbour_;
    //var sender ="";

    app.post('/'+WS+'notifs', function (req, res) {
        var currentPallet = getPallet();
        var event = req.body.id;
        var sender = req.body.senderID;
        var path = currentPallet.path_[0];
        var destination = [];
        var WS_ID = "WS"+sender.substr(6,2);
        var WS_num = sender.substr(6,2);
        //console.log(WS_ID);
        switch (event) {
            case "Z1_Changed": {
                if (req.body.payload.PalletID != -1) {
                    if(currentPallet.path_.length!=0 ){
                        for(var i=0; i<path.length; i++){
                            destination[i] = path[i];
                        }
                    }
                    //console.log(destination);
                    if((destination[0] == WS_ID)||(destination[1] == WS_ID)||(destination[2] == WS_ID)||(destination[3] == WS_ID)){
                        currentPallet.path_.shift();
                        //console.log(currentPallet);
                        setPallet(currentPallet);
                        var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                        setTimeout(function(){simRequest(url)},4000);
                    }
                    else{
                        url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                        setTimeout(function(){simRequest(url)},4000);
                    }
                }
                break;
            }
            case "Z2_Changed": {
                if (req.body.payload.PalletID != -1) {
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone23';
                    setTimeout(function(){simRequest(url)},4000);
                }
                break;
            }
            case "Z3_Changed": {
                if (req.body.payload.PalletID != -1) {
                    var palletStatus = currentPallet.status_;
                    //console.log(palletStatus);
                    switch (palletStatus){
                        case 0 : {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            url = 'http://localhost:3000/RTU/SimROB1/services/LoadPaper';
                            setTimeout(function(){
                                simRequest(url);
                                palletRequest(WS_Neighbour);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                },8000);
                            },4000);
                            break;
                        }
                        case 1: {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            var frameType = currentPallet.frameType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WS_num+'/services/Draw'+frameType;
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                },8000);
                            },4000);
                            break;
                        }
                        case 2: {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            var screenType = currentPallet.screenType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WS_num+'/services/Draw'+screenType;
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                },8000);
                            },4000);
                            break;
                        }
                        case 3: {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            var keyType = currentPallet.keyType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WS_num+'/services/Draw'+keyType;
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                },8000);
                            },4000);
                            break;
                        }
                    }
                }
                break;
            }
            case "Z4_Changed": {
                if (req.body.payload.PalletID != -1) {
                    palletRequest(WS_Neighbour);
                    var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
                    setTimeout(function(){simRequest(url)},4000);
                }
                break;
            }
            case "Z5_Changed": {
                if (req.body.payload.PalletID != -1) {

                }
                break;
            }
            case "DrawStartExecution":{
                break;
            }
            case "DrawEndExecution":{
                var recipe = parseInt(req.body.payload.Recipe);
                //console.log(recipe);
                switch (recipe){
                    case 1:
                    case 2:
                    case 3:{
                        //console.log("hi-frame");
                        currentPallet.frameType_ = "done" + recipe;
                        palletRequest(WS_Neighbour);
                        break;
                    }
                    case 4:
                    case 5:
                    case 6:{
                        //console.log("hi-screen");
                        currentPallet.screenType_ = "done" + recipe;
                        palletRequest(WS_Neighbour);
                        break;
                    }
                    case 7:
                    case 8:
                    case 9:{
                        //console.log("hi-key");
                        currentPallet.keyType_ = "done" + recipe;
                        palletRequest(WS_Neighbour);
                        break;
                    }
                }
                break;
            }
            default:{
                res.end("ERROR");
            }
        }
        res.end();
    });

    app.post('/'+WS+'pallet', function (req,res) {
        console.log("*********",WS,"************", WS_Neighbour);
        console.log(req.body);
        resetPallet();
        setPallet(req.body);
        res.end();
    });

    //subscribing to the events from the SIMULATOR
    if((port!=4007)&&(port!=4001)){
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    }
    else if(port == 4007){
        // request.post('http://localhost:3000/RTU/SimROB7/events/PalletLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        // request.post('http://localhost:3000/RTU/SimROB7/events/PalletUnloaded/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        // request.post('http://localhost:3000/RTU/SimCNV7/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        // request.post('http://localhost:3000/RTU/SimCNV7/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        // request.post('http://localhost:3000/RTU/SimCNV7/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
        // request.post('http://localhost:3000/RTU/SimCNV7/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/notifs"}}, function(err,httpResponse,body){});
    }
    else if(port==4001){
        request.post('http://localhost:3000/RTU/SimROB1/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB1/events/PaperUnloaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV1/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV1/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV1/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV1/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    }

    app.listen(port, hostname, function(){
        console.log(WS+` Server running at http://${hostname}:${port}/`);
    });
};

module.exports = WS_Agent;