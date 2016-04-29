var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

app.use(express.static('www'));

var iSeeCount = 0;
var hashCount = 0;
var pdeFile = [];

var infoStatus = "off";
var serviceLock = false;
var headerMsg = "Ｃ＋＋１　Processingで作った，みんなのプログラムをドラッグ・アンド・ドロップしてみよう！";

app.get('/*.jpg', function(req, res){
	res.end();
});

app.get('/pde/:id', function(req, res){
	res.send(pdeFile[req.params.id]);
});

app.get('/admin/dumpPdeFiles', function(req, res){
	res.json(pdeFile);
});

app.get('/admin/info/:status', function(req, res){
	if (req.params.status == "on") {
		io.emit('info', "on");
		infoStatus = "on";
	} else if (req.params.status == "off") {
		io.emit('info', "off");
		infoStatus = "off";
	}
	
	res.end();
	
});

app.get('/admin/serviceLock/:status', function(req, res){
	if (req.params.status == "on") {
		serviceLock = true;
	} else if (req.params.status == "off") {
		serviceLock = false;
	}
	
	res.end();
	
});

app.get('/admin/headerMsg/:msg', function(req, res){
	headerMsg = req.params.msg;
	io.emit('header', headerMsg);

	res.end();
});

io.on('connection', function(socket){
	
	socket.emit('info', infoStatus);
	socket.emit('header', headerMsg);

	socket.on('newMessage', function(msg){

		if(msg.body == "/w-num") {
			io.emit('newMessage', {body:socket.client.conn.server.clientsCount, id:"SRV"});
			return false;
		}

		// HTMLタグを弾く
		msg.body = msg.body.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'');
		
		if (msg.body.length >= 140)
			return false;

		io.emit('newMessage', {body: msg.body, id: socket.id, color: msg.color});

	});

	socket.on('iSeeCount', function(msg){
		iSeeCount++;
	});

	socket.on('pdeFile', function(msg){

		if (!serviceLock) {
			pdeFile[hashCount] = msg;
			io.emit('pdeFile', {id: socket.id, hash: hashCount} );
			hashCount++;
		}

	});

});

setInterval(function() {

	viewers = io.eio.clientsCount;
	
	io.emit('graphUupdate', {viewers: viewers, iSeeCount: iSeeCount});
	iSeeCount = 0;
	
}, 500);

server.listen(process.env.PORT || 3000, function(){
	console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
