// Internet proxy for HA Server, web server for client and proxy all web 
// server websockets requests to the home server 
setInterval(checkConn, 10000);

var express = require('express');
var compression = require('compression');
var url = require('url');

var app = express();
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