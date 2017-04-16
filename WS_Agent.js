var WS_Status = ['WS1Stat', 'WS2Stat', 'WS3Stat', 'WS4Stat','WS5Stat', 'WS6Stat','WS7Stat', 'WS8Stat','WS9Stat', 'WS10Stat', 'WS11Stat', 'WS12Stat'];
var pallets = [{}];

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

    function setPallet(pallet) {
        pallets.push(pallet);
    }
    function findPalletinPallets(palletID) {
        for(var i=0;i<pallets.length;i++){
            if(pallets[i].palletID_ == palletID)
            {
                return i;
            }
        }
    }
    function resetPallets(palletID) {
        var index = findPalletinPallets(palletID);
        pallets[index]="done" + palletID;
        console.log(pallets);
    }
    var currentStatus = "free";
    function setStatus(stat) {
        currentStatus = stat;
    }
    function getStatus() {
        return currentStatus;
    }
    function palletRequest(url, palletIndex) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify(pallets[palletIndex]),
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
                if((getStatus() == "free")||(WS_ID=='WS1')){
                    if (req.body.payload.PalletID != -1) {
                        console.log(WS,'Z1changed');
                        //console.log(pallets);
                        var palletIndex = findPalletinPallets(req.body.payload.PalletID);
                        console.log('pallet is in: ',palletIndex);
                        var path = pallets[palletIndex].path_[0];
                        console.log('path is', path);
                        if(pallets[palletIndex].path_.length!=0 ){
                            for(var i=0; i<path.length; i++){
                                destination[i] = path[i];
                            }
                        }
                        if(WS_ID == 'WS1'){
                            global.palletIndexWS1 = palletIndex;
                            pallets[palletIndex].path_.shift();
                            var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                            simRequest(url);
                        }
                        else{
                            if((destination[0] == WS_ID)||(destination[1] == WS_ID)||(destination[2] == WS_ID)||(destination[3] == WS_ID)){
                                pallets[palletIndex].path_.shift();
                                var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                                simRequest(url);
                            }
                            else{
                                url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                simRequest(url);
                            }
                        }
                    }
                }
                else{
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                    simRequest(url);
                }
                break;
            }
            case "Z2_Changed": {
                if (req.body.payload.PalletID != -1) {
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone23';
                    simRequest(url);
                }
                break;
            }
            case "Z3_Changed": {
                if (req.body.payload.PalletID != -1) {
                    palletIndex = findPalletinPallets(req.body.payload.PalletID);
                    var palletStatus = pallets[palletIndex].status_;
                    switch (palletStatus){
                        case 0 : {
                            url = 'http://localhost:3000/RTU/SimROB1/services/LoadPaper';
                            simRequest(url);
                            break;
                        }
                        case 1: {
                            var frameType = pallets[palletIndex].frameType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+frameType;
                            simRequest(url);
                            break;
                        }
                        case 2: {
                            var screenType = pallets[palletIndex].screenType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screenType;
                            simRequest(url);
                            break;
                        }
                        case 3: {
                            var keyType = pallets[palletIndex].keyType_;
                            url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyType;
                            simRequest(url);
                            break;
                        }
                        default:{
                            //palletRequest(WS_Neighbour,currentPallet);
                            url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                            simRequest(url);
                        }
                    }
                }
                break;
            }
            case "Z4_Changed": {
                if (req.body.payload.PalletID != -1) {
                    url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
                    simRequest(url);
                }
                break;
            }
            case "Z5_Changed": {
                if (req.body.payload.PalletID != -1) {
                    setStatus("free");
                    palletIndex = findPalletinPallets(req.body.payload.PalletID);
                    if(WS_ID=='WS6'){
                        palletRequest(WS_Neighbour, palletIndex);
                    }
                }
                break;
            }
            case "PaperLoaded":{
                console.log('WS-Paperload',palletIndexWS1);
                pallets[palletIndexWS1].status_++;
                url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                simRequest(url);
                break;
            }
            case "DrawEndExecution":{
                var recipe = parseInt(req.body.payload.Recipe);
                palletIndex = findPalletinPallets(req.body.payload.PalletID);
                switch (recipe){
                    case 1:
                    case 2:
                    case 3:{
                        pallets[palletIndex].frameType_ = "done" + recipe;
                        break;
                    }
                    case 4:
                    case 5:
                    case 6:{
                        pallets[palletIndex].screenType_ = "done" + recipe;
                        break;
                    }
                    case 7:
                    case 8:
                    case 9:{
                        pallets[palletIndex].keyType_ = "done" + recipe;
                        break;
                    }
                }
                pallets[palletIndex].status_=pallets[palletIndex].status_+1;
                path = pallets[palletIndex].path_[0];
                if(pallets[palletIndex].path_.length!=0 ){
                    for(i=0; i<path.length; i++){
                        destination[i] = path[i];
                    }
                }
                if((destination[0] == WS_ID)||(destination[1] == WS_ID)||(destination[2] == WS_ID)||(destination[3] == WS_ID)){
                    pallets[palletIndex].path_.shift();
                    if(pallets[palletIndex].status_==2){
                        screenType = pallets[palletIndex].screenType_;
                        url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screenType;
                        simRequest(url);
                    }
                    if(pallets[palletIndex].status_==3){
                        keyType = pallets[palletIndex].keyType_;
                        url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyType;
                        simRequest(url);
                    }
                    var screenStat = pallets[palletIndex].screenType_.toString();
                    var keyStat = pallets[palletIndex].keyType_.toString();
                    if((screenStat.substr(0,4) == "done")&&((keyStat).substr(0,4) == "done")||(keyStat).substr(0,4) == "done"){
                        url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                        simRequest(url);
                    }
                }
                else{
                    url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                    simRequest(url);
                }
                //palletRequest(WS_Neighbour,currentPallet);
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

    app.post('/'+WS+'palletRemoved', function (req,res) {
        var palletID = req.body.palletID_;
        resetPallets(palletID);
        res.end();
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