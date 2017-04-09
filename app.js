var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var http = require('http');

var Pallet_Agent = require('./Pallet_Agent');
var WS_Agent = require('./WS_Agent');
var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

var hostname = 'localhost';
var port = 4000;

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
var WS1 = new WS_Agent('WS1', 'paperLoader');
var WS8 = new WS_Agent('WS8','red');
var WS9 = new WS_Agent('WS9','green');

var WS = [WS8,WS9];
var path = [WS1.getName()];

function searchCapability(frameColor, screenColor, keyColor){
  for(var i=0; i < 2; i++){
    if(WS[i].getCapability() == frameColor){
      var frameWS = WS[i].getName();
      path.push(frameWS);
    }
    if(WS[i].getCapability() == screenColor){
      var screenWS = WS[i].getName();
      path.push(screenWS);
    }
    if(WS[i].getCapability() == keyColor){
      var keyWS = WS[i].getName();
      path.push(keyWS);
    }
  }
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
var currentPallet;
function setPallet(pallet) {
  currentPallet = pallet;
}
function getPallet() {
  return currentPallet;
}


app.post('/notifs', function (req, res) {
  console.log(req.body);
  var event = req.body.id;
  var sender ="";

  if(event == "PalletLoaded"){
    var palletID = req.body.payload.PalletID;
    var pallet = new Pallet_Agent(palletID,2,'red',3,'green',1,'green');
    pallet.setPath(searchCapability(pallet.getFrameColor(),pallet.getScreenColor(),pallet.getKeyColor()));
    setPallet(pallet);
    var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone35';
    simRequest(url);
    //console.log(typeof (pallet));
  }
  switch (event) {
    case "Z1_Changed": {
      if (req.body.payload.PalletID != -1) {
        sender = req.body.senderID;
        var currentPallet = getPallet();
        var destination = currentPallet.getPath()[0];
        console.log(destination.substr(-1));
        if((destination.substr(-1))=== (sender.substr(6,2))){
          console.log("reached");
        }else{
          console.log(sender);
          var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone14';
          setTimeout(function(){simRequest(url)},4000);
        }
      }
      break;
    }
    case "Z4_Changed": {
      sender = req.body.senderID;
      //console.log(sender);
      if (req.body.payload.PalletID != -1) {
        var url = 'http://localhost:3000/RTU/'+sender+'/services/TransZone45';
        setTimeout(function(){simRequest(url)},4000);
      }
      break;
    }
  }
res.end();
});
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

//subscribing to the events from the SIMULATOR
request.post('http://localhost:3000/RTU/SimROB7/events/PalletLoaded/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB7/events/PalletUnloaded/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV7/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});

request.post('http://localhost:3000/RTU/SimROB1/events/PaperLoaded/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimROB1/events/PaperUnloaded/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV1/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV1/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV1/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
request.post('http://localhost:3000/RTU/SimCNV1/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});

for(var j=2; j<7; j++){
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimROB'+j+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimROB'+j+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
}
for(var j=8; j<13; j++){
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z1_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z2_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z3_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z4_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimCNV'+j+'/events/Z5_Changed/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimROB'+j+'/events/DrawStartExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
  request.post('http://localhost:3000/RTU/SimROB'+j+'/events/DrawEndExecution/notifs',{form:{destUrl:"http://localhost:4000/notifs"}}, function(err,httpResponse,body){});
}

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

//server at localhost:4000
app.listen(port, hostname, function(){
  console.log(`Server running at http://${hostname}:${port}/`);
});

module.exports = app;
