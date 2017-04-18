var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');
var mysql = require('mysql');

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

var connection = mysql.createConnection({
    host     : 'localhost',
    port: 3306, //Port number to connect to for the DB.
    user     : 'root', //!!! NB !!! The user name you have assigned to work with the database.
    password : '123456', //!!! NB !!! The password you have assigned
    database : 'DASD' //!!! NB !!! The database you would like to connect.
});

app.get('/', function(req, res) {
    res.render('index');
});

var WS1 = new WS_Agent('WS1', 'paperLoader', 'WS2', 4001);
var WS2 = new WS_Agent('WS2', 'RED', 'WS3', 4002);
var WS3 = new WS_Agent('WS3', 'GREEN', 'WS4', 4003);
var WS4 = new WS_Agent('WS4', 'BLUE', 'WS5', 4004);
var WS5 = new WS_Agent('WS5', 'RED', 'WS6', 4005);
var WS6 = new WS_Agent('WS6', 'GREEN', 'WS7', 4006);
var WS8 = new WS_Agent('WS8','BLUE', 'WS8', 4008);
var WS9 = new WS_Agent('WS9','RED', 'WS9', 4009);
var WS10 = new WS_Agent('WS10', 'GREEN', 'WS10', 4010);
var WS11 = new WS_Agent('WS11', 'BLUE', 'WS11', 4011);
var WS12 = new WS_Agent('WS12', 'RED', 'WS12', 4012);
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
var pathPallet = [[WS1.getName()]];
var framePath = [];
var screenPath = [];
var keyPath = [];

connection.query('UPDATE ws_stat SET WS1 = "free" ,WS2 = "free" ,WS3 = "free" ,WS4 = "free" ,WS5 = "free" ,WS6 = "free" ,WS7 = "free" ,WS8 = "free"' +
    ',WS9 = "free" ,WS10 = "free" ,WS11 = "free" ,WS12 = "free" ',function (err) {
    if (err) {
        console.error(err);
    }
    else {
        console.log(' status of all work stations turn to free');
    }
});

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
function simRequest(url) {
    request({
        url: url,
        method: "POST",
        body: JSON.stringify({destUrl:'http://hostname'}),
        headers:{'Content-Type':'application/json'}
    },function (err, res, body) {});
}

app.post('/orders', function (req, res){
    connection.query('insert into orders (frame_type,frame_color,screen_type,screen_color,keyboard_type,keyboard_color,quantity) values ( "' + req.body.frame + '", "'
        + req.body.framecolor + '",' + ' "' + req.body.screen + '", "' + req.body.screencolor +
        '", "' + req.body.key + '", "' + req.body.keycolor + '",' +
        ' "' + req.body.quantity + '")',function (err) {
        if (err) {
            console.error(err);
        }
        else {
            console.log('Database updated-Order Successful');
            res.end("New order created ");
        }
    })
});


app.post('/WS7notifs', function (req, res) {
    var palletID = req.body.payload.PalletID;
    var event = req.body.id;

    if (palletID != -1) {
        switch (event){
            case "PalletLoaded":{
                var status = 0;
                connection.query('SELECT * from orders order by id desc limit 1', function (err, rows) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        var frame_type = rows[0].frame_type;
                        var frame_color = rows[0].frame_color;
                        var screen_type = rows[0].screen_type;
                        var screen_color = rows[0].screen_color;
                        var keyboard_type = rows[0].keyboard_type;
                        var keyboard_color = rows[0].keyboard_color;
                        var pallet = new Pallet_Agent(palletID,frame_type,frame_color,screen_type,screen_color,keyboard_type,keyboard_color,status);
                        pallet.setPath(searchCapability(pallet.getFrameColor(),pallet.getScreenColor(),pallet.getKeyColor()));

                        connection.query('insert into pallet_info (pallet_id,pallet_status,pallet_path_start,pallet_frame_path,pallet_screen_path,pallet_key_path,frame_type' +
                            ',frame_color,screen_type,screen_color,keyboard_type,keyboard_color) values ( "' + palletID + '", "'
                            + status + '", "' + pallet.path_[0] + '","' + pallet.path_[1] + '","' + pallet.path_[2] + '","' + pallet.path_[3] +
                            '","' + frame_type + '","' + frame_color + '","' + screen_type + '","' + screen_color + '","' + keyboard_type + '","' + keyboard_color + '")',function (err) {
                            if (err) {
                                console.error(err);
                            }
                            else {
                                console.log(' the info of ' + palletID + ' inserted into database-pallet_info');
                            }
                        });
                    }
                });
                break;
            }
            case "Z1_Changed":{
                connection.query('UPDATE ws_stat SET ws7 = "busy"',function (err) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone12';
                        simRequest(url);
                    }
                });
                break;
            }
            case "Z2_Changed":{
                var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone23';
                simRequest(url);
                break;
            }
            case "Z3_Changed":{
                setTimeout(function () {
                    connection.query('SELECT * from pallet_info where pallet_id=  "' + palletID + '"  order by id desc limit 1', function (err, rows) {
                        if (err) {
                            console.error(err);
                        }
                        else {
                            var palletStat = rows[0].pallet_status;

                            if(palletStat !=4){
                                var url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone35';
                                simRequest(url);
                                resetPath();
                            }
                            else{
                                url = 'http://localhost:3000/RTU/SimROB7/services/UnloadPallet';
                                simRequest(url);

                                connection.query('UPDATE ws_stat SET WS7 = "free"',function (err) {
                                    if (err) {
                                        console.error(err);
                                    }
                                    else {
                                        console.log(' The status of WS7 changed to free');
                                    }
                                });

                            }
                        }
                    });
                },300);
                break;
            }
            case "Z5_Changed":{
                connection.query('UPDATE ws_stat SET WS7 = "free"',function (err) {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        console.log(' The status of WS7 changed to free');
                    }
                });
                break;}
        }
    }
    else{
        switch(event) {
            case  "Z5_Changed": {
                url = 'http://localhost:3000/RTU/SimCNV6/services/TransZone45';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV6/services/TransZone14';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV6/services/TransZone35';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone12';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone23';
                simRequest(url);
                break;
            }
            case "PalletUnloaded" :{
                console.log('pallet unloaded');
                url = 'http://localhost:3000/RTU/SimCNV6/services/TransZone45';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV6/services/TransZone14';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV6/services/TransZone35';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone12';
                simRequest(url);
                url = 'http://localhost:3000/RTU/SimCNV7/services/TransZone23';
                simRequest(url);
                break;
            }
        }
    }

    res.end();
});

//subscription to Simulator
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
app.use(function(err, req, res) {
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
