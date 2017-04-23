/**
 * Created by halder on 09-Apr-17.
 */
var Pallet_Agent = function Pallet_Agent(palletID, orderID, frameType, frameColor, screenType, screenColor, keyType, keyColor, status, port) {
    this.palletID_ = palletID;
    this.orderID_ = orderID;
    this.frameType_ = frameType;
    this.frameColor_ = frameColor;
    this.screenType_ = screenType;
    this.screenColor_ = screenColor;
    this.keyType_ = keyType;
    this.keyColor_ = keyColor;
    this.status_ = status;
    this.path_ = [];
    this.port_ = port;
    this.hostname_ = "localhost";
};

Pallet_Agent.prototype.getPort = function () {
    return this.port_;
};
Pallet_Agent.prototype.getFrameColor = function () {
    return this.frameColor_;
};

Pallet_Agent.prototype.getScreenColor = function () {
    return this.screenColor_;
};

Pallet_Agent.prototype.getKeyColor = function () {
    return this.keyColor_;
};

Pallet_Agent.prototype.setPath = function (path) {
    this.path_ = path;
};

Pallet_Agent.prototype.runServer = function () {
    var express = require('express');
    var bodyParser = require('body-parser');
    var request = require('request');

    var port = this.port_;
    var hostname = this.hostname_;
    //var palletID = this.palletID_;
    //var orderID = this.orderID_;

    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    var currentPallet = {   'palletID_':this.palletID_,
        'orderID_':this.orderID_,
        'frameType_':this.frameType_,
        'frameColor_':this.frameColor_,
        'screenType_':this.screenType_,
        'screenColor_':this.screenColor_,
        'keyType_':this.keyType_,
        'keyColor_':this.keyColor_,
        'status_': this.status_,
        'path_':this.path_,
        'port_':this.port_,
        'hostname_':this.hostname_   };

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
            body: JSON.stringify(currentPallet),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    //var priority = false;
    function setStatusBusy(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    function setStatusFree(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    function setPriority(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    function resetPriority(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    function checkPriority(url1, url2) {
        request({
            url: url1,
            method: "GET",
        },function (err, res, body) {
            if(body!=="YES"){
                simRequest(url2);
                console.log('*************NOT prior trans35', url2);
            }
            else{
                setTimeout(function () {
                    checkPriority(url1, url2);
                    console.log('prior waiting');
                },10000);
            }
        });
    }
    app.post('/'+currentPallet.palletID_+'notifs', function (req, res) {
        var event = req.body.id;
        var sender = req.body.senderID;
        var WS_ID = "WS"+sender.substr(6,2);
        var WSTempNum = parseInt(sender.substr(6,2));
        var palletID = parseInt(req.body.payload.PalletID);
        if(WSTempNum<10){
            var WS_Num = '0'+WSTempNum;
        }
        else{
            WS_Num = WSTempNum;
        }
        setTimeout(function () {
            switch (event){
                case "Z1_Changed": {
                    if ((palletID !== -1) && (palletID === currentPallet.palletID_)) {
                        url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'getStatus';
                        request({
                            url: url,
                            method: "GET",
                        },function (err, res, body) {
                            if(body==="free"){
                                url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'pallet';
                                palletRequest(url);
                                console.log('********PalletReq',WS_ID,event,url, port);
                                url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                                setStatusBusy(url);
                                if(WS_ID==='WS7'){
                                    url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone12';
                                    //console.log('*********', WS_ID, url);
                                    simRequest(url);
                                }
                            }
                            else{
                                if((WS_ID==='WS1')||(WS_ID==='WS7')){
                                    url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone12';
                                    console.log('****busy***',WS_ID, url);
                                    simRequest(url);
                                }
                                else{
                                    //console.log('inside ELSE');
                                    url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone14';
                                    simRequest(url);
                                    url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setPriority';
                                    setPriority(url);
                                }
                            }
                        });
                    }
                    break;
                }
                case "Z2_Changed": {
                    break;
                }
                case "Z3_Changed": {
                    if ((palletID !== -1)&&(palletID === currentPallet.palletID_)) {
                        url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                        palletRequest(url);
                        console.log('********PalletReq',WS_ID, event ,url,port);
                        url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                        setStatusBusy(url);
                        if(WS_ID==='WS1'){
                            global.palletWS1ID = currentPallet.palletID_;
                        }
                    }
                    break;
                }
                case "Z4_Changed":{
                    if ((palletID !== -1)&&(palletID === currentPallet.palletID_)){
                        url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setPriority';
                        setPriority(url);
                        url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                        setStatusBusy(url);
                    }
                    break;
                }
                case "Z5_Changed":{
                    if ((palletID !== -1)&&(palletID === currentPallet.palletID_)){
                        url = 'http://localhost:3000/RTU/'+sender+'/data/P3';
                        request({
                            url: url,
                            method: "GET"
                        },function (err, res, body) {
                            if(parseInt(body.substr(5,1))===0){
                                url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusFree';
                                setStatusFree(url);
                            }
                        });
                        url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'resetPriority';
                        resetPriority(url);
                    }
                    break;
                }
                case "PaperLoaded":{
                    if(palletWS1ID === currentPallet.palletID_){
                        currentPallet.status_ = 1;
                        var url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                        palletRequest(url);
                        console.log('********PalletReq',WS_ID, event ,url, port);
                        url = 'http://localhost:3000/RTU/SimCNV1/services/TransZone35';
                        simRequest(url);
                    }
                    break;
                }
                case "DrawStartExecution":{
                    url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                    setStatusBusy(url);
                    break;
                }
                case "DrawEndExecution":{
                    if ((palletID !== -1)&&(palletID === currentPallet.palletID_)) {
                        var recipe = parseInt(req.body.payload.Recipe);
                        switch (recipe){
                            case 1:
                            case 2:
                            case 3:{
                                currentPallet.frameType_ = "done" + recipe;
                                currentPallet.status_ = 2;
                                break;
                            }
                            case 4:
                            case 5:
                            case 6:{
                                currentPallet.screenType_ = "done" + recipe;
                                currentPallet.status_=3;
                                break;
                            }
                            case 7:
                            case 8:
                            case 9:{
                                currentPallet.keyType_ = "done" + recipe;
                                currentPallet.status_ = 4;
                                break;
                            }
                        }
                        var palletStatus = currentPallet.status_;
                        switch (palletStatus) {
                            case 2: {
                                if (currentPallet.path_[2].indexOf(WS_ID) > -1) {
                                    var screenType = currentPallet.screenType_;
                                    url = 'http://localhost:3000/RTU/SimROB' + WSTempNum + '/services/Draw' + screenType;
                                    simRequest(url);
                                    url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                                    palletRequest(url);
                                    console.log('********PalletReq',WS_ID, event ,url, port);
                                    url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                                    setStatusBusy(url);
                                }
                                else{
                                    var url1 = 'http://localhost:40'+WS_Num+'/'+WS_ID+'getPriority';
                                    var url2 = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone35';
                                    checkPriority(url1, url2);
                                }
                                break;
                            }
                            case 3: {
                                if (currentPallet.path_[3].indexOf(WS_ID) > -1) {
                                    var keyType = currentPallet.keyType_;
                                    url = 'http://localhost:3000/RTU/SimROB' + WSTempNum + '/services/Draw' + keyType;
                                    simRequest(url);
                                    url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                                    palletRequest(url);
                                    console.log('********PalletReq',WS_ID, event ,url, port);
                                    url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                                    setStatusBusy(url);
                                }
                                else{
                                    url1 = 'http://localhost:40'+WS_Num+'/'+WS_ID+'getPriority';
                                    url2 = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone35';
                                    checkPriority(url1, url2);
                                }
                                break;
                            }
                            default:{
                                url1 = 'http://localhost:40'+WS_Num+'/'+WS_ID+'getPriority';
                                url2 = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone35';
                                checkPriority(url1, url2);
                            }
                        }
                    }
                    break;
                }
            }
        },10);
        res.end();
    });

    for(var i=1; i<13; i++){
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
    }
    request.post('http://localhost:3000/RTU/SimROB1/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){console.log('paper notifs');});

    app.listen(port, hostname, function(){
        console.log('PalletID: '+currentPallet.palletID_+ ',OrderID: '+currentPallet.orderID_+` Server running at http://${hostname}:${port}/`);
    });
};

module.exports = Pallet_Agent;