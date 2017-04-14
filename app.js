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

var WS1 = new WS_Agent('WS1', 'paperLoader', 'http://localhost:4002/WS2pallet', 4001);
var WS2 = new WS_Agent('WS2', 'red', 'http://localhost:4003/WS3pallet', 4002);
var WS3 = new WS_Agent('WS3', 'green', 'http://localhost:4004/WS4pallet', 4003);
var WS4 = new WS_Agent('WS4', 'blue', 'http://localhost:4005/WS5pallet', 4004);
var WS5 = new WS_Agent('WS5', 'red', 'http://localhost:4006/WS6pallet', 4005);
var WS6 = new WS_Agent('WS6', 'green', 'http://localhost:4007/WS7pallet', 4006);
var WS8 = new WS_Agent('WS8','blue', 'http://localhost:4009/WS9pallet', 4008);
var WS9 = new WS_Agent('WS9','red', 'http://localhost:4010/WS10pallet', 4009);
var WS10 = new WS_Agent('WS10', 'green', 'http://localhost:4011/WS11pallet', 4010);
var WS11 = new WS_Agent('WS11', 'blue', 'http://localhost:4012/WS12pallet', 4011);
var WS12 = new WS_Agent('WS12', 'red', 'http://localhost:4001/WS1pallet', 4012);
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
var WS = [WS1,WS2,WS3,WS4,WS5,WS6,WS8,WS9,WS10,WS11,WS12];
var path = [[WS1.getName()]];
var framePath = [];
var screenPath = [];
var keyPath = [];

function searchCapability(frameColor, screenColor, keyColor){
  for(var i=0; i < WS.length; i++){
    if(WS[i].getCapability() == frameColor){
      var frameWS = WS[i].getName();
      framePath.push(frameWS);
    }
    if(WS[i].getCapability() == screenColor){
      var screenWS = WS[i].getName();
      screenPath.push(screenWS);
    }
    if(WS[i].getCapability() == keyColor){
      var keyWS = WS[i].getName();
      keyPath.push(keyWS);
    }
  }
  path.push(framePath);
  path.push(screenPath);
  path.push(keyPath);
  return path;
}
function resetPath(){
  framePath = [];
  screenPath = [];
  keyPath = [];
  path = [[WS1.getName()]];
    return path;
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
var currentPallet;
function setPallet(pallet) {
  currentPallet = pallet;
}
function getPallet() {
  return currentPallet;
}

app.post('/WS7notifs', function (req, res) {
    var palletID = req.body.payload.PalletID;
    var event = req.body.id;
    currentPallet = getPallet();
    switch (event){
        case "PalletLoaded":{
            var pallet = new Pallet_Agent(palletID,2,'red',5,'red',8,'red',0);
            pallet.setPath(searchCapability(pallet.getFrameColor(),pallet.getScreenColor(),pallet.getKeyColor()));
            setPallet(pallet);
            break;
        }
        case "Z1_Changed":{
            url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone12';
            setTimeout(function () {
                simRequest(url);
            },4000);
            break;
        }
        case "Z2_Changed":{
            url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone23';
            setTimeout(function () {
                simRequest(url);
            },4000);
            break;
        }
        case "Z3_Changed":{
            setTimeout(function () {
                if(currentPallet.status_ !=4){
                    var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone35';
                    setTimeout(function(){
                        simRequest(url);
                        url = 'http://localhost:4008/WS8pallet';
                        palletRequest(url);
                        resetPath();
                    },4000);
                }
                else{
                    url = 'http://localhost:3000/RTU/SimROB7/services/UnloadPallet';
                    setTimeout(function () {
                        simRequest(url);
                    },4000);
                }
            },4000);
            break;
        }
    }
    res.end();
});

app.post('/WS7pallet', function (req,res){
    console.log("*********WS7************",req.body);
    setPallet(req.body);
    res.end();
});

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

app.listen(port, hostname, function(){
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;
