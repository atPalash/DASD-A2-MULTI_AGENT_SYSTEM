var WS_Agent = function WS_Agent(name, capability, neighbour, port ) {
    this.name_ = name;
    this.capability_ = capability;
    this.neighbour_ = neighbour;
    this.port_ = port;
    this.hostname_ = "localhost";
    this.busyStatus_ = false;
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

    var currentPallet;
    function setPallet(pallet) {
        currentPallet =pallet;
    }
    function getPallet() {
        return currentPallet;
    }

    function setStatusBusy() {
        this.busyStatus_ = true;
    }
    function setStatusFree() {
        this.busyStatus_ = false;
    }
    function getStatus() {
        return this.busyStatus_;
    }
    /*function palletRequest(port, palletID) {
        request({
            url: 'http://localhost:'+port+'/'+palletID+'newPallet',
            method: "POST",
            body: JSON.stringify(getPallet()),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }*/
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
        var WS_ID = "WS"+sender.substr(6,2);
        var palletID = req.body.payload.PalletID;
        currentPallet = getPallet();
        setTimeout(function () {
            switch (event) {
                case "Z1_Changed": {
                        if(!getStatus()){
                            console.log("*******WS STATUS-Z1-1",WS_ID, getStatus());
                            if ((palletID != -1)&&(palletID==currentPallet.palletID_)) {
                                setStatusBusy();
                                console.log("*******WS STATUS-Z1-1",WS_ID, getStatus());
                                var palletStatus = currentPallet.status_;
                                switch(palletStatus){
                                    case 0: {
                                        if(WS_ID!='WS1'){
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                            simRequest(url);
                                        }
                                        else {
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                                            simRequest(url);
                                        }
                                        break;
                                    }
                                    case 1:{
                                        if(currentPallet.path_[1].indexOf(WS_ID)==-1){
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                            simRequest(url);
                                        }
                                        else{
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                                            simRequest(url);
                                        }
                                        break;
                                    }
                                    case 2:{
                                        if(currentPallet.path_[2].indexOf(WS_ID)==-1){
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                            simRequest(url);
                                        }
                                        else{
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                                            simRequest(url);
                                        }
                                        break;
                                    }
                                    case 3:{
                                        if(currentPallet.path_[3].indexOf(WS_ID)==-1){
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
                                            simRequest(url);
                                        }
                                        else{
                                            url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone12';
                                            simRequest(url);
                                        }
                                        break;
                                    }
                                    default:{
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
                    if (palletID != -1) {
                        url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone23';
                        simRequest(url);
                    }
                    break;
                }
                case "Z3_Changed": {
                    if ((palletID != -1)&&(palletID==currentPallet.palletID_)) {
                        port = currentPallet.port_;
                        palletStatus = currentPallet.status_;

                        switch (palletStatus){
                            case 0 : {
                                var url = 'http://localhost:3000/RTU/SimROB1/services/LoadPaper';
                                simRequest(url);
                                break;
                            }
                            case 1: {
                                var frameType = currentPallet.frameType_;
                                url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+frameType;
                                simRequest(url);
                                break;
                            }
                            case 2: {
                                var screenType = currentPallet.screenType_;
                                url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+screenType;
                                simRequest(url);
                                break;
                            }
                            case 3: {
                                var keyType = currentPallet.keyType_;
                                url = 'http://localhost:3000/RTU/SimROB'+WSnum+'/services/Draw'+keyType;
                                simRequest(url);
                                break;
                            }
                            default:{
                                url = 'http://localhost:3000/RTU/SimCNV'+WSnum+'/services/TransZone35';
                                simRequest(url);
                            }
                        }
                    }
                    break;
                }
                case "Z4_Changed": {
                    if ((palletID != -1)&&(palletID==currentPallet.palletID_)) {
                        url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
                        simRequest(url);
                    }
                    break;
                }
                case "Z5_Changed": {
                    if ((palletID != -1)&&(palletID==currentPallet.palletID_)) {
                        setStatusFree();
                        console.log("*******WS STATUS -Z5",WS_ID, getStatus());
                    }
                    break;
                }
                default:{
                    res.end("ERROR");
                }
            }
        },1000);
        res.end();
    });

    app.post('/'+WS+'pallet', function (req,res) {
        console.log("*********",WS,"************",req.body);
        setPallet(req.body);
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
        //request.post('http://localhost:3000/RTU/SimROB'+WSnum+'/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+WS+"notifs"}}, function(err,httpResponse,body){});
    }
    app.listen(port, hostname, function(){
        console.log(WS+`Server running at http://${hostname}:${port}/`);
    });
};

module.exports = WS_Agent;