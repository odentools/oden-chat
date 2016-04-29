var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var helper = require(__dirname + '/helper');

app.use(express.static('www'));

var iSeeCount = 0;
var hashCount = 0;
var pdeFile = [], pdeImgFiles = [];

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

		if (serviceLock) return;

		var pde = msg;

		// スケッチファイルに含まれた画像ファイルのパスを抽出
		var image_paths = pde.match(/[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|gif)/ig);
		if (image_paths == null || image_paths.length == 0) { // 画像ファイルがなければ
			// ファイルをメモリへ保存し，ファイル情報を配信
			pdeFile[hashCount] = pde;
			io.emit('pdeFile', {id: socket.id, hash: hashCount} );
			hashCount++;
			return;
		}

		// Webからランダムな画像を1つ取得
		helper.getRandomImage(function (img_buffer) {

			var image_buffers = [];
			if (img_buffer != null) { // 取得成功ならば
				image_buffers[0] = img_buffer;
				// 使いまわせるようにメモリへ保存
				pdeImgFiles.push(img_buffer);
			}

			// 取得失敗時 or 2枚目以降の画像が必要なならば，既存画像から選ぶ
			if (1 <= pdeImgFiles.length) { // 既存画像があれば
				for (var i = image_buffers.length; i < image_paths.length; i++) {
					image_buffers[i] = pdeImgFiles[Math.floor(Math.random() * pdeImgFiles.length)];
				}
			}

			// スケッチファイルを書き換え
			image_paths.forEach(function (path, i) {
				var img_uri;
				if (image_buffers[i] != null) { // 選ばれた画像があれば
					// 画像をBASE64データへ変更
					img_uri = 'data:image/jpeg;base64,' + image_buffers[i].toString('base64');
				} else {
					// OdenToolsロゴへ変更
					img_uri = 'img/odentools_logo.png';
				}
				// 書き換え
				pde = pde.replace(path, img_uri, 'g');
			});

			// ファイルをメモリへ保存し，ファイル情報を配信
			pdeFile[hashCount] = pde;
			io.emit('pdeFile', {id: socket.id, hash: hashCount} );
			hashCount++;

		});
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
