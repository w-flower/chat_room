var ws = require("nodejs-websocket");
var express = require("express");
var c_uid = require("uuid");
const { maxRecordSize } = require("npmlog");
var app = express();
var port = 3101;
var user = 0;
var uuid = {};
var conns = {};
var names = {};

// 创建一个连接
var server = ws.createServer(function (conn) {
    console.log("创建一个新的连接--------");
    user++;
    if (user>=1000) { user = 1;}
    conn.nickname = "user" + user;
    var mes = {}; // 消息
    var nm = {}; // 昵称
    var id = c_uid(); // uuid
    conn.id = id;
    uuid[id] = conn;
    conns[conn] = id;
    names[id] = conn.nickname;
    mes.type = "enter";
    mes.data = conn.nickname + " 进来啦";
    broadcast(JSON.stringify(mes)); // 广播进入消息 
    nm.type = "name"
    nm.data = conn.nickname;
    conn.sendText(JSON.stringify(nm)); // 向客户端发送昵称
    // conn.sendText(conn.nickname)
    // 向客户端推送消息
    nm.type = "uuid";
    nm.dat = id;
    conn.sendText(JSON.stringify(nm)); // 向客户端发送uuid
    mes.type = "list";
    mes.data = names;
    broadcast(JSON.stringify(mes))
    conn.on("text", function (str) {
        var nm = {};
        var mes = {};
        try {
            var js = JSON.parse(str);
        } catch (err){
            console.log("！！！紧急错误！！！");
            console.log(err);
            return 0;
        }
        if (js["type"] == 'nick name') {
            nickname = conn.nickname;
            conn.nickname = js["value"];
            console.log(nickname + '将自己名字改为' + conn.nickname);
            mes.type = "message";
            nm.type = "name";
            nm.data = conn.nickname;
            names[conn.id] = conn.nickname;
            conn.sendText(JSON.stringify(nm));
            mes.data = nickname + '将自己名字改为' + conn.nickname;
            broadcast(JSON.stringify(mes));
            mes.type = "list";
            mes.data = names;
            broadcast(JSON.stringify(mes));
        } else if (js["type"] == 'message') {
            
            console.log("回复 " + js["value"]);
            mes.type = "message";
            mes.data = conn.nickname + " 说:    " + js["value"];
            broadcast(JSON.stringify(mes));
        }
    });

    //监听关闭连接操作
    conn.on("close", function (code, reason) {
        console.log("关闭连接");
        mes.type = "leave";
        mes.data = conn.nickname + " 离开了";
        delete uuid[conns[conn]];
        delete conns[conn];
        delete names[id]
        broadcast(JSON.stringify(mes));
        mes.type = "list"
        mes.data = names
        broadcast(JSON.stringify(mes));

    });

    //错误处理
    conn.on("error", function (err) {
        console.log("监听到错误");
        console.log(err);
    });
}).listen(port);

app.get('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.use('/static', express.static("static"));

var svr = app.listen(3000, function () {
    var host = svr.address().address;
    var port = svr.address().port;
    console.log("服务器开启地址为 http://%s:%s", host, port);
});

function broadcast(str) {
    server.connections.forEach(function (connection) {
        connection.sendText(str);
    });
}

