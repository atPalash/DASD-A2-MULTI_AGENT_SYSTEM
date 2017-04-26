//define the Pallet Agent attribute
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
//defining pallet Agent methods
//return the port of pallet
Pallet_Agent.prototype.getPort = function () {
    return this.port_;
};
//return the frameColor of pallet
Pallet_Agent.prototype.getFrameColor = function () {
    return this.frameColor_;
};
//return the screenColor of pallet
Pallet_Agent.prototype.getScreenColor = function () {
    return this.screenColor_;
};
//return the keyColor of pallet
Pallet_Agent.prototype.getKeyColor = function () {
    return this.keyColor_;
};
//set the Workstations the pallet can visit
Pallet_Agent.prototype.setPath = function (path) {
    this.path_ = path;
};
//create server for the pallet
Pallet_Agent.prototype.runServer = function () {
    var express = require('express');
    var bodyParser = require('body-parser');
    var request = require('request');

    var port = this.port_;
    var hostname = this.hostname_;

    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    //create local current pallet object for method runServer
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
    //simulator request at the url passed
    function simRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify({destUrl:'http://hostname'}),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    //send pallet data at the url passed
    function palletRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify(currentPallet),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }
    //make GET request to the WorkStation to set its status BUSY
    function setStatusBusy(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    //make GET request to the WorkStation to set its status FREE
    function setStatusFree(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    //make GET request to the WorkStation to set priority to the pallet in Zone 4 to pass first (this is used to prevent collisions)
    function setPriority(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    //make GET request to the WorkStation to reset priority flag when the pallet from Zone 4 goes out of WorkStation
    function resetPriority(url) {
        request({
            url: url,
            method: "GET",
        },function (err, res, body) {});
    }
    //a recursive function to check the priority flag and then allow the pallet at Zone 3 to move when there is movement of pallet at Zone 4 (this is used to prevent collisions)
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
    //get POST notification and operate accordingly
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
                        //check BUSY Status of Work Station
                        request({
                            url: url,
                            method: "GET",
                        },function (err, res, body) {
                            //if Workstation is FREE then only send the pallet Data else go to bi-pass line and continue, make status of Workstation busy if allowed
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
                                //check WorkStation name for WS1 and WS7, there are no bi-pass line so allow to move to main line.
                                if((WS_ID==='WS1')||(WS_ID==='WS7')){
                                    url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone12';
                                    console.log('****busy***',WS_ID, url);
                                    simRequest(url);
                                }
                                else{
                                    url = 'http://localhost:3000/RTU/SimCNV' + WSTempNum + '/services/TransZone14';
                                    simRequest(url);
                                    url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setPriority';
                                    setPriority(url);//set priority flag of WorkStation to inform that a pallet passed via bi-pass line
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
                        //POST the pallet Data to the WorkStation
                        url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                        palletRequest(url);
                        console.log('********PalletReq',WS_ID, event ,url,port);
                        url = 'http://localhost:40' + WS_Num + '/' + WS_ID + 'setStatusBusy';
                        setStatusBusy(url);
                        if(WS_ID==='WS1'){
                            global.palletWS1ID = currentPallet.palletID_; //a global variable used to make it available at PaperLoaded event
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
                        //check presence of pallet at Zone 3, if FREE change the BUSYstatus otherwise just reset the priority.
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
                        currentPallet.status_ = 1; //increase the pallet Status to 1 to indicate that paper has been loaded
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
                        var recipe = parseInt(req.body.payload.Recipe); //check for recipe drawn
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
                                //check if the Work Station can draw other requirement of the pallet if possible draw otherwise go out of the WorkStation
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
                                //check if the Work Station can draw other requirement of the pallet if possible draw otherwise go out of the WorkStation
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

    //subscribe to all the events of the Simulator
    for(var i=1; i<13; i++){
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
        request.post('http://localhost:3000/RTU/SimROB'+i+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){});
    }
    request.post('http://localhost:3000/RTU/SimROB1/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/"+currentPallet.palletID_+"notifs"}}, function(err,httpResponse,body){console.log('paper notifs');});

    //server listening
    app.listen(port, hostname, function(){
        console.log('PalletID: '+currentPallet.palletID_+ ',OrderID: '+currentPallet.orderID_+` Server running at http://${hostname}:${port}/`);
    });
};

module.exports = Pallet_Agent;