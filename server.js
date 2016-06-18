// Internet proxy for HA Server, web server for client and proxy all web 
// server websockets requests to the home server 

var express = require('express');
var compression = require('compression')
var app = express();
var __dirname = "";
app.use(compression({
    threshold: 512
}));
var oneDay = 86400000;
app.use(express.static(__dirname + '/Public', { maxAge: oneDay }));

//var http = require('http').createServer(function (req, res) {
//    res.writeHead(200, { 'Content-Type': 'text/html' });
//    res.end('HA Server Proxy');  
//}).listen(process.env.PORT);

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
