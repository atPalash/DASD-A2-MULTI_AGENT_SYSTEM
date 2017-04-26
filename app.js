var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');

var index = require('./routes/index');
var users = require('./routes/users');
var WS_Agent = require('./WS_Agent');
var Pallet_Agent = require('./Pallet_Agent');

var app = express();
var hostname = 'localhost';
var port = 4007;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

//creation of Work Station agents with attributes defined as parameters
var WS1 = new WS_Agent('WS1', 'PAPERLOADER', 'http://localhost:4002/WS2pallet', 4001);
var WS2 = new WS_Agent('WS2', 'RED', 'http://localhost:4003/WS3pallet', 4002);
var WS3 = new WS_Agent('WS3', 'GREEN', 'http://localhost:4004/WS4pallet', 4003);
var WS4 = new WS_Agent('WS4', 'BLUE', 'http://localhost:4005/WS5pallet', 4004);
var WS5 = new WS_Agent('WS5', 'RED', 'http://localhost:4006/WS6pallet', 4005);
var WS6 = new WS_Agent('WS6', 'GREEN', 'http://localhost:4007/WS7pallet', 4006);
var WS8 = new WS_Agent('WS8', 'BLUE', 'http://localhost:4009/WS9pallet', 4008);
var WS9 = new WS_Agent('WS9', 'RED', 'http://localhost:4010/WS10pallet', 4009);
var WS10 = new WS_Agent('WS10', 'GREEN', 'http://localhost:4011/WS11pallet', 4010);
var WS11 = new WS_Agent('WS11', 'BLUE', 'http://localhost:4012/WS12pallet', 4011);
var WS12 = new WS_Agent('WS12', 'RED', 'http://localhost:4001/WS1pallet', 4012);

//calling the runServer method to open respective server for each agent
WS1.runServer();
WS2.runServer();
WS3.runServer();
WS4.runServer();
WS5.runServer();
WS6.runServer();
WS8.runServer();
WS9.runServer();
WS10.runServer();
WS11.runServer();
WS12.runServer();

//searching for the Work Station the pallet can visit to reach the GOAL
var WS = [WS1,WS2,WS3,WS4,WS5,WS6,WS8,WS9,WS10,WS11,WS12];
var pathPallet = [[WS1.getName()]];
var framePath = [];
var screenPath = [];
var keyPath = [];

function searchCapability(frameColor, screenColor, keyColor){
    for(var i=0; i < WS.length; i++){
        if(WS[i].getCapability() === frameColor){
            var frameWS = WS[i].getName();
            framePath.push(frameWS);
        }
        if(WS[i].getCapability() === screenColor){
            var screenWS = WS[i].getName();
            screenPath.push(screenWS);
        }
        if(WS[i].getCapability() === keyColor){
            var keyWS = WS[i].getName();
            keyPath.push(keyWS);
        }
    }
    pathPallet.push(framePath);
    pathPallet.push(screenPath);
    pathPallet.push(keyPath);
    return pathPallet;
}
function resetPath(){
    framePath = [];
    screenPath = [];
    keyPath = [];
    pathPallet = [[WS1.getName()]];
    return pathPallet;
}

//sending Simulator request to actuate the process
function simRequest(url) {
    request({
        url: url,
        method: "POST",
        body: JSON.stringify({destUrl:'http://hostname'}),
        headers:{'Content-Type':'application/json'}
    },function (err, res, body) {});
}

//defining local variable to set and get the pallet data accordingly.
var currentPallet;
function setPallet(pallet) {
    currentPallet = pallet;
}
function getPallet() {
    return currentPallet;
}

//defining local variable to set and get the order data accordingly.
var currentOrder;
function setOrder(order) {
    currentOrder = order;
}
function getOrder() {
    return currentOrder;
}

//defining local variable to set and get the BUSY status accordingly.
var statusBusy = "free";
function setStatusBusy() {
    statusBusy = "busy";
}
function setStatusFree() {
    setTimeout(function () {
        statusBusy = "free";
    },1000);
}
function getBusyStatus() {
    return statusBusy;
}
//checks status of WS7- no pallet is allowed to load until WS7 is free
function checkBusy(url) {
    if(getBusyStatus()==="free"){
        simRequest(url);
    }
    else{
        setTimeout(function () {
            checkBusy(url);
        },5000)
    }
}
//making a GET request to 4500/orders to receive the order data
request({
    url: 'http://localhost:4500/orders',
    method: "GET",
},function (err, res, body) {
    console.log("*********request for order***********",err);
});

//receive the order Data and call setOrder.
app.post('/WS7orders', function (req, res) {
    //console.log(req.body);
    setOrder(req.body);
    var url_in = 'http://localhost:3000/RTU/SimROB7/services/LoadPallet';
    setTimeout(function () {
        simRequest(url_in);
    }, 1000);
    res.end();
});

//set status busy/free of WS on receiving the GET request
app.get('/WS7setStatusBusy', function (req, res) {
    setStatusBusy();
    res.end();
});
app.get('/WS7setStatusFree', function (req, res) {
    setStatusFree();
    res.end();
});
//get current Status
app.get('/WS7getStatus', function (req, res){
    res.end(getBusyStatus());
});


var count = 1; //local variable to count the number of pallets entered

//receive notifications and make requests accordingly
app.post('/WS7notifs', function (req, res) {
    var palletID = req.body.payload.PalletID;
    var event = req.body.id;
    var currentOrder = getOrder();
    var quantity = currentOrder.quantity;
    if(palletID === "undefined"){
        console.log("***********UNDEFINED PALLET ID TERMINATE PROCESS***********");
    }
    switch (event){
        case "PalletLoaded":{
            setStatusBusy();
            if (count < quantity) {
                var url_in = 'http://localhost:3000/RTU/SimROB7/services/LoadPallet';
                //wait for 10s to load another pallet
                setTimeout(function () {
                    checkBusy(url_in);
                }, 10000);
            }
            //create new pallet agent with each pallet loaded
            var pallet = new Pallet_Agent(palletID,currentOrder.orderID,currentOrder.frame,currentOrder.framecolor,currentOrder.screen,currentOrder.screencolor,currentOrder.keyboard,currentOrder.keyboardcolor,0, 5000+count);
            //search for WS to visit to reach the GOAL
            pallet.setPath(searchCapability(pallet.getFrameColor(),pallet.getScreenColor(),pallet.getKeyColor()));
            setPallet(pallet); //set path attribute of the pallet
            pallet.runServer(); //run server for the pallet created
            resetPath(); //re-initialise the path local variable ina app.js
            count++;
            break;
        }
        case "Z1_Changed":{
            /*if (palletID != -1){
                setTimeout(function () {
                    var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone12';
                    simRequest(url);
                },10);
            }*/
            break;
        }
        case "Z2_Changed":{
            if (palletID !== -1){
                setTimeout(function () {
                    var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone23';
                    simRequest(url);
                },10);
            }
            break;
        }
        case "Z3_Changed":{
            if (palletID !== -1){
                setStatusBusy(); //with Z3 change call to set status of WS busy
                setTimeout(function () {
                    var currentPallet = getPallet(); //receive the pallet data

                    //check condition and decide operation
                    if(currentPallet.status_ !==4){
                        var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone35';
                        simRequest(url);
                    }
                    else{
                        url = 'http://localhost:3000/RTU/SimROB7/services/UnloadPallet';
                        simRequest(url);
                        setStatusFree();
                    }
                },100);//Z3_Changed the Pallet_Loaded event occur at same time at WS7, wait till the pallet data is available(*change the the time if error- palletID not found occurs)
            }
            break;
        }
        case "Z5_Changed":{
            //check for presence of pallet at Zone3, if no pallet is there set the status of station free with this event
            if (palletID !== -1){
                var url = 'http://localhost:3000/RTU/SimCNV7/data/P3';
                request({
                    url: url,
                    method: "GET"
                },function (err, res, body) {
                    if(parseInt(body.substr(5,1))===0){
                        setStatusFree();
                        console.log(body.substr(5,1),'Z3 free');
                    }
                    else{
                        console.log('busy');
                    }
                });
            }
            break;
        }
    }
    res.end();
});

//receive pallet data
app.post('/WS7pallet', function (req,res){
    //console.log("*********WS7************",req.body);
    setPallet(req.body);
    res.end();
});

//subscribe to events occurring at the Simulator
request.post('http://localhost:3000/RTU/SimROB7/events/PalletLoaded/notifs',{form:{destUrl:"http://localhost:"+port+"/WS7notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB7/events/PalletUnloaded/notifs',{form:{destUrl:"http://localhost:"+port+"/WS7notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/WS7notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/WS7notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/WS7notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:"+port+"/WS7notifs"}}, function(err,httpResponse,body){});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

//server listening
app.listen(port, hostname, function(){
    console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;