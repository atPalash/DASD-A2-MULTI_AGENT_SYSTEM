var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var request = require('request');;

var index = require('./routes/index');
var users = require('./routes/users');
var WS_Agent = require('./WS_Agent');
var Pallet_Agent = require('./Pallet_Agent');

var app = express();
var hostname = 'localhost';
var port = 4500;

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

//this function provides the user Data as JSON string to the url passed.
function palletRequest(url, order) {
    request({
        url: url,
        method: "POST",
        body: JSON.stringify(order),
        headers: {'Content-Type': 'application/json'}
    }, function (err, res, body) {
    });
}

//set a local variable as customer order
var customerOrder;
function setOrder(order) {
    customerOrder =  order;
}
//return customer order when called
function getOrder() {
    return customerOrder;
}

//listen for POST request at /orders, create a order JSON
app.post('/orders', function (req, res) {
    var ID = new Date().getTime();
    var order = {
            "orderID": ID,
            "frame":req.body.frame,
            "framecolor":req.body.framecolor,
            "screen":req.body.screen,
            "screencolor":req.body.screencolor,
            "keyboard":req.body.key,
            "keyboardcolor":req.body.keycolor,
            "quantity":req.body.quantity,
    };
    setOrder(order);
    //console.log(order);
    res.end('New order Created');
//Make DB connection to store to DB (NOT implemented in this version);
});

//send the order JSON to the concerned url
app.get('/orders', function (req, res) {
    //console.log(req);
    res.end('order Subscription received...');
    var order = getOrder();
    //console.log(order);
    //Make DB connection to send orders from DB;
    var url = 'http://localhost:4007/WS7orders';
    palletRequest(url, order);
});

//server listening
app.listen(port, hostname, function () {
    console.log(`Orders Server running at http://${hostname}:${port}/`);
});

