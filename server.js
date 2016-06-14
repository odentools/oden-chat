var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var helper = require(__dirname + '/helper');

// wwwディレクトリを静的ファイルディレクトリとして登録
app.use(express.static('www'));

var iSeeCount = 0;    // 現在の閲覧者数
var hashCount = 0;    // PDEファイルの管理番号
var pdeFile = [],     // PDEファイルを保持するメモリ
    pdeImgFiles = []; // 差し替え用の画像を保持するメモリ

var infoStatus = "off"; // 運営メッセージ 表示/非表示
var serviceLock = false;// PDEファイルの投稿 許可/拒否

// デフォルトの運営メッセージ
var headerMsg = "Ｃ＋＋１　Processingで作った，みんなのプログラムをドラッグ・アンド・ドロップしてみよう！";


// 管理用 - メモリに存在するPDEファイルをダンプ
app.get('/admin/dumpPdeFiles', function(req, res) {
    // メモリをJSON形式で出力
    res.json(pdeFile);
});

// 管理用 -  運営メッセージ 表示/非表示 切り替え
app.get('/admin/info/:status', function(req, res) {

    if (req.params.status == "on") {  // リクエストが '/admin/info/on' の場合
        // 運営メッセージの表示命令を送信
        io.emit('info', "on");
        infoStatus = "on";
    } else if (req.params.status == "off") { // リクエストが '/admin/info/off' の場合
        // 運営メッセージの非表示命令を送信
        io.emit('info', "off");
        infoStatus = "off";
    }

    res.end();

});

// 管理用 - PDEファイルの投稿 許可/拒否 切り替え
app.get('/admin/serviceLock/:status', function(req, res) {

    if (req.params.status == "on") {  // リクエストが '/admin/serviceLock/on' の場合
        serviceLock = true;
    } else if (req.params.status == "off") {  // リクエストが '/admin/serviceLock/off' の場合
        serviceLock = false;
    }

    res.end();

});

// 管理用 - 運営メッセージの書き換え
app.get('/admin/headerMsg/:msg', function(req, res) {

    // リクエストされたメッセージを，運営メッセージ表示命令として送信
    headerMsg = req.params.msg;
    io.emit('header', headerMsg);

    res.end();

});

// メモリに保存されたPDEファイルへのアクセス要求
app.get('/pde/:id', function(req, res) {
    // 指定された管理番号のPDEファイルを出力
    res.send(pdeFile[req.params.id]);
});

// jpgファイルへのアクセスを無視
app.get('/*.jpg', function(req, res) {
    res.end();
});


// サーバへの接続時
io.on('connection', function(socket) {

    // 運営の 表示/非表示 命令送信，運営メッセージ送信
    socket.emit('info', infoStatus);
    socket.emit('header', headerMsg);

    // メッセージ受信時
    socket.on('newMessage', function(msg) {

        // 管理用 − 接続者数の表示
        if (msg.body == "/w-num") {
            io.emit('newMessage', {
                body: socket.client.conn.server.clientsCount,
                id: "SRV"
            });
            return false;
        }

        // HTMLタグを弾く
        msg.body = msg.body.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');

        if (msg.body.length >= 140)
            return false;

        io.emit('newMessage', {
            body: msg.body,
            id: socket.id,
            color: msg.color,
            size: msg.size
        });

    });

    socket.on('iSeeCount', function(msg) {
        iSeeCount++;
    });

    socket.on('pdeFile', function(msg) {

        if (serviceLock) return;

        var pde = msg;

        // スケッチファイルに含まれた画像ファイルのパスを抽出
        var image_paths = pde.match(/[a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|gif)/ig);
        if (image_paths == null || image_paths.length == 0) { // 画像ファイルがなければ
            // ファイルをメモリへ保存し，ファイル情報を配信
            pdeFile[hashCount] = pde;
            io.emit('pdeFile', {
                id: socket.id,
                hash: hashCount
            });
            hashCount++;
            return;
        }

        // Webからランダムな画像を1つ取得
        helper.getRandomImage(function(img_buffer) {

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
            image_paths.forEach(function(path, i) {
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
            io.emit('pdeFile', {
                id: socket.id,
                hash: hashCount
            });
            hashCount++;

        });
    });

});

setInterval(function() {

    viewers = io.eio.clientsCount;

    io.emit('graphUupdate', {
        viewers: viewers,
        iSeeCount: iSeeCount
    });
    iSeeCount = 0;

}, 500);

server.listen(process.env.PORT || 3000, function() {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
