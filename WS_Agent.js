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

    var WS_Neighbour = this.neighbour_;
    var currentPallet;
    function setPallet(pallet) {
        currentPallet = pallet;
    }
    function getPallet() {
        return currentPallet;
    }
    function palletRequest(url, pallet) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify(pallet),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    function simRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify({destUrl:'http://hostname'}),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    app.post('/'+WS+'notifs', function (req, res) {
        var event = req.body.id;
        var sender = req.body.senderID;

        var destination = [];
        var WS_ID = "WS"+sender.substr(6,2);

        switch (event) {
            case "Z1_Changed": {
                if (req.body.payload.PalletID != -1) {
                    //currentPallet = getPallet();
                    console.log(WS,'Z1changed',currentPallet);
                    var path = currentPallet.path_[0];
                    if(currentPallet.path_.length!=0 ){
                        for(var i=0; i<path.length; i++){
                            destination[i] = path[i];
                        }
                    }
                    if((destination[0] == WS_ID)||(destination[1] == WS_ID)||(destination[2] == WS_ID)||(destination[3] == WS_ID)){
                        currentPallet.path_.shift();
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
                    //currentPallet = getPallet();
                    var palletStatus = currentPallet.status_;
                    switch (palletStatus){
                        case 0 : {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            url = 'http://localhost:3000/RTU/SimROB1/services/LoadPaper';
                            palletRequest(WS_Neighbour,currentPallet);
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                }.bind(this),8000);
                            },4000);
                            break;
                        }
                        case 1: {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            var frameType = currentPallet.frameType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+frameType;
                            palletRequest(WS_Neighbour,currentPallet);
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                }.bind(this),8000);
                            },4000);
                            break;
                        }
                        case 2: {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            var screenType = currentPallet.screenType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screenType;
                            palletRequest(WS_Neighbour,currentPallet);
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                    simRequest(url)
                                }.bind(this),8000);
                            },4000);
                            break;
                        }
                        case 3: {
                            currentPallet.status_++;
                            //setPallet(currentPallet);
                            var keyType = currentPallet.keyType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyType;
                            palletRequest(WS_Neighbour,currentPallet);
                            setTimeout(function(){
                                simRequest(url);
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone35';
                                setTimeout(function(){
                                   simRequest(url)
                                }.bind(this),8000);
                            },4000);
                            break;
                        }
                    }
                }
                break;
            }
            case "Z4_Changed": {
                if (req.body.payload.PalletID != -1) {
                    currentPallet = getPallet();
                    palletRequest(WS_Neighbour, currentPallet);
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
                    setTimeout(function(){simRequest(url)},4000);
                }
                break;
            }
            case "DrawEndExecution":{
                var recipe = parseInt(req.body.payload.Recipe);
                switch (recipe){
                    case 1:
                    case 2:
                    case 3:{
                        currentPallet.frameType_ = "done" + recipe;
                        palletRequest(WS_Neighbour,currentPallet);
                        break;
                    }
                    case 4:
                    case 5:
                    case 6:{
                        currentPallet.screenType_ = "done" + recipe;
                        palletRequest(WS_Neighbour,currentPallet);
                        break;
                    }
                    case 7:
                    case 8:
                    case 9:{
                        currentPallet.keyType_ = "done" + recipe;
                        palletRequest(WS_Neighbour,currentPallet);
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
        console.log("*********",WS,"************",req.body);
        setPallet(req.body);
        res.end();
    });

    request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    request.post('http://localhost:3000/RTU/SimCNV'+WSnum+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});

    app.listen(port, hostname, function(){
        console.log(WS+`Server running at http://${hostname}:${port}/`);
    });
};

module.exports = WS_Agent;







