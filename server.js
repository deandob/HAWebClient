// Internet proxy for HA Server, web server for client and proxy all web 
// server websockets requests to the home server 
setInterval(checkConn, 10000);

var express = require('express');
var compression = require('compression');
var url = require('url');

var app = express();
//var __dirname = "wwwroot/";
app.use(compression({
    threshold: 512
}));
var oneDay = 86400000;
app.use(express.static(__dirname + "/", { maxAge: oneDay }));
console.log('Starting websocket relay');

var http = require('http').createServer(app).listen(process.env.PORT);

var wsSvr = require('ws').Server;
var wss = new wsSvr({ server: http });
var svrSock = null, cliSock = null;

wss.on('connection', function connection(ws) {
    var location = url.parse(ws.upgradeReq.url, true);
    console.log("Connection from: " + location.href);
    if (location.path === "/host:80/HAServer") {
        console.log("Home Server connected: " + location.path);
        svrSock = ws;
        ws.on('message', function incoming(msg) {
            if (msg !== "") {
            console.log("Message from Home Server: " + msg);
            if (cliSock !== null) cliSock.send(msg);                
            }
        });
        ws.on('close', function () {
            console.log("Home Server disconnected");
        });
    } else {
        console.log("Remote client connected: " + location.path);
        cliSock = ws;
        ws.on('message', function incoming(msg) {
            console.log("Message from remote client: " + msg);
            if (svrSock !== null) {
                svrSock.send(msg);
                console.log("Sent to Server")
            } else {
                console.log("Server not connected, not sent");
            }
        });
        ws.on('close', function () {
            console.log("HA Client disconnected");
            if (svrSock !== null) svrSock.close();
        });
    }
});


function checkConn() {
   console.log("running"); 
}

/*
wsc.on('connection', function connection(ws) {
    console.log("Remote client connected: " + location.host);
    cliSock = ws;
    ws.on('message', function incoming(msg) {
        console.log("Message from remote client: " + msg);
        if (svrSock !== null) {
            svrSock.send(msg);
            console.log("Sent to Server")
        } else {
            console.log("Server not connected, not sent");
        }
    });
    ws.on('close', function () {
        console.log("HA Client disconnected");
        if (svrSock !== null) svrSock.close();
    });
});


function checkConn() {
   console.log("running"); 
}


/*
// Internet proxy for HA Server, web server for client and proxy all web 
// server websockets requests to the home server 

var express = require('express');
var compression = require('compression');
var app = express();
//var __dirname = "wwwroot/";
app.use(compression({
    threshold: 512
}));
var oneDay = 86400000;
app.use(express.static(__dirname + "/", { maxAge: oneDay }));

console.log('Starting websocket relay');
var ws = require('websocket.io');
var http = require('http').createServer(app).listen(process.env.PORT);

var homeSvr = ws.attach(http, { path: '/HAServer', clientTracking: true });
var cliSvr = ws.attach(http, { path: '/HAclient', clientTracking: true });

var svrSock = null, cliSock = null;
homeSvr.on('connection', function (socket) {
    console.log("Home Server connected");
    svrSock = socket;
    socket.on('message', function (msg) {
        console.log("Message from Home Server: " + msg);
        if (cliSock !== null) cliSock.send(msg);
    });
    socket.on('close', function () {
        console.log("Home Server disconnected");
    });
});

cliSvr.on('connection', function (socket) {
    console.log("HA Client connected");
    cliSock = socket;
    socket.on('message', function (msg) {
        console.log("Message from HA Client: " + msg);
        if (svrSock !== null) {
            svrSock.send(msg);
            console.log("Sent to Server")
        } else {
            console.log("Server not connected, not sent");
        }
    });
    socket.on('close', function () {
        console.log("HA Client disconnected");
        if (svrSock !== null) svrSock.close();
    });
});

setInterval(checkConn, 3000);

function checkConn() {
    
}



*/