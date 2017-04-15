/**
 * Created by halder on 09-Apr-17.
 */
var Pallet_Agent = function Pallet_Agent(palletID, frameType, frameColor, screenType, screenColor, keyType, keyColor, status, port) {
    this.palletID_ = palletID;
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
    var palletID = this.palletID_;

    var app = express();

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));

    var currentPallet;
    function setPallet(pallet) {
        currentPallet = pallet;
    }
    function getPallet() {
        return currentPallet;
    }
    function palletRequest(url) {
        request({
            url: url,
            method: "POST",
            body: JSON.stringify(getPallet()),
            headers:{'Content-Type':'application/json'}
        },function (err, res, body) {});
    }

    app.post('/'+palletID+'notifs', function (req, res) {
        var event = req.body.id;
        var sender = req.body.senderID;
        var WS_ID = "WS"+sender.substr(6,2);
        var WSTempNum = parseInt(sender.substr(6,2));
        console.log(palletID);
        if(WSTempNum<10){
            var WS_Num = '0'+WSTempNum;
        }
        else{
            WS_Num = WSTempNum;
        }
        setTimeout(function () {
            switch (event){
                case "Z1_Changed": {
                    setTimeout(function () {
                        if ((req.body.payload.PalletID != -1)&&(req.body.payload.PalletID == palletID)) {
                            var url = 'http://localhost:40'+WS_Num+'/'+WS_ID+'pallet';
                            console.log(url);
                            palletRequest(url);
                        }
                    },100);
                    break;
                }
            }
        },50);
        res.end();
    });
    app.post('/'+palletID+'newPallet', function (req, res) {
        console.log(req.body);
        setPallet(req.body);
        res.end();
    });
    for(var i=1; i<13; i++){
        request.post('http://localhost:3000/RTU/SimCNV'+i+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/"+palletID+"notifs"}}, function(err,httpResponse,body){});
    }
    app.listen(port, hostname, function(){
        console.log('PalletID: '+palletID+` Server running at http://${hostname}:${port}/`);
    });
};

module.exports = Pallet_Agent;