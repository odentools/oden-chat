var moji=60;
var batten=[];

$(function() {

	// サーバへ接続
	var socket = io();

	// 画面を流れるコメント用の設定
	nicoscreen.start();
	var droppable = $("#nicoscreen");

	// FileAPIのサポート確認
	if (!window.FileReader) {
		console.log("File API がサポートされていません。");
		return false;
	}


	/* ---- */


	/**
	* フッターにランダムなメッセージを設定
	*/
	var setMsg = function() {

		var msg = new Array();
		msg[0] = 'できたてホカホカの美味しい ソフトウェアとサービスを。';
		msg[1] = '”こういうツールがあったら便利かも”というアイデアがあったら是非教えてください。';
		msg[2] = 'プロジェクトのソースコードを公開しています: <a href="https://github.com/odentools" target="_blank">GitHub</a>';
		msg[3] = 'ご興味をお持ちの方は、Twitter の <a href="https://twitter.com/odentools" target="_blank">@odentools</a> へお気軽にMentionsをお送りいただければ幸いです！';

		// ランダムにメッセージ配列のインデックスを選ぶ
		var msgNo = Math.floor(Math.random() * msg.length);
		$('#msg').html(msg[msgNo]);

	};


	/**
	* メッセージの送信処理
	*/
	var sendMsg = function() {

		// テキストボックスからメッセージを取得
		var textMsg = $('#textBox').val();

		// 空白の場合送信中止
    var m=textMsg.match(/^\s*$/g);
		if (m!=null) {
			return;
    }

		// Windowsからタイ文字の送信をブロック
		if (navigator.platform.indexOf("Win") != -1) {
			for (var i = 0, leni = textMsg.length; i < leni; i++) {
				if (textMsg.charCodeAt(i) >= 3586 && textMsg.charCodeAt(i) <= 3675) {
					$('#textBox').val('');
					return;
				}
			}
		}

		// サーバにメッセージを送信
		socket.emit('newMessage', {
			body: textMsg,						// メッセージ
			color: $('#color').val(),	// 文字色
			size: moji+"px"
		});

		// メッセージボックスを空にする
		$('#textBox').val('');

	};

	var setBatten=function(){
		var NGword=$('#NGbox').val();
		batten.push(NGword);
		$('#NGbox').val('');
	}

	/**
	* 現在時刻の取得
	*/
	var getTime = function() {

		var nowTime = new Date();

		// 1桁のの場合桁数を2桁の補完
		var hour = nowTime.getHours() < 10 ? '0' + nowTime.getHours() : nowTime.getHours();
		var minute = nowTime.getMinutes() < 10 ? '0' + nowTime.getMinutes() : nowTime.getMinutes();
		var second = nowTime.getSeconds() < 10 ? '0' + nowTime.getSeconds() : nowTime.getSeconds();

		return (hour + ':' + minute + ':' + second);

	};


	/**
	* Processing実行画面の表示
	*/
	var addProcessing = function(hash, id) {
		var iframeDom = '<iframe src="pde.html?pdeName=' + hash + '" name="pfeFile">';

		// チャットエリアにiframeを埋め込む
		$('#chatArea').prepend($('<tr><td>' + getTime() + '<td>' + id + '<td>' + iframeDom + '</tr>'));
	};


	/**
	* イベントのキャンセル（droppable.bind)
	*/
	var cancelEvent = function(event) {
		event.preventDefault();	// イベントのキャンセル
		event.stopPropagation();// イベントの伝播をキャンセル
		return false;
	}


	/**
	* ファイルのドロップイベント発生時（droppable.bind)
	*/
	var handleDroppedFile = function(event) {

		// ドロップされた1つ目のファイルを指定
		var file = event.originalEvent.dataTransfer.files[0];

		var fileReader = new FileReader();
		fileReader.onload = function(event) {

			// 正規表現でファイルの拡張子が'pde'か確認
			var reg = /(.*)(?:\.([^.]+$))/;
			if (file.name.match(reg)[2] != 'pde')
			return false;

			// PDEファイル内のプログラムコードを取得
			var source = event.target.result;

			// ソースコード中 size(); 命令を強制的に size(500, 500);に書き換
			source = source.replace(/size(.*);/g, "size(500, 500);");

			// ソースコードをサーバに送信
			socket.emit('pdeFile', source);

		}

		// ファイル内の文字列の読み込みを開始
		fileReader.readAsText(file);

		// ドロップイベントのキャンセル
		cancelEvent(event);

		return false;

	};


	/* ---- */


	/**
	* 送信ボタンクリック時（イベントリスナー）
	*/
	$('#send').click(function() {
		sendMsg();
		return false;	// clickイベントのキャンセル
	});

	$('#large').click(function() {
		moji=100;
		return false;
	});

	$('#medium').click(function() {
		moji=60;
		return false;
	});

	$('#small').click(function() {
		moji=40;
		return false;
	});

	/**
	 * テキストボックにて，Enter入力時（イベントリスナー）
	 */
	$('#textBox').keydown(function(e) {
		// キーコードがEnterの場合
      if (e.keyCode === 13)	{
          sendMsg();
					return false;
			}
  });

	/**
	* NGボックスにて，Enter入力時（イベントリスナー）
	*/
	$('#NGbox').keydown(function(e) {
		// キーコードがEnterの場合
		if (e.keyCode === 13)	{
			setBatten();
			return false;
		}
	});


	/**
	* なるほどなぁボタンクリック時
	*/
	$('#iSeeCount').click(function() {
		socket.emit('iSeeCount');
		return false;	// clickイベントのキャンセル
	});

	$('#NGword').click(function() {
		setBatten();
		return false;
	});

	/*　----　*/


	/**
	*　新規メッセージ受信時
	*/

	socket.on('newMessage', function(msg) {
		for(var i=0;i < batten.length;i++){
			if (msg.body.indexOf(batten[i]) != -1) {
				console.log("NG");
				return;
			}
		}


		// チャットエリアにメッセージの追加
		$('#chatArea').prepend($('<tr><td>' + getTime() + '<td>' + msg.id + '<td>' + msg.body + '</tr>'));

		// 画面上を流れるコメントを追加
		nicoscreen.add(msg.body, msg.color,msg.size);

	});


	/**
	* グラフの更新命令受信時
	* サーバより，500mS毎に送信
	*/
	socket.on('graphUupdate', function(msg) {
		viewers = msg.viewers;
		iSeeCount = msg.iSeeCount;
	});


	/**
	* PDEファイルの配信受信時
	*/
	socket.on('pdeFile', function(msg) {
		// 読み込むPDEファイルのハッシュ値を指定して，画面に表示する
		addProcessing(msg.hash, msg.id);
	});


	/**
	* 運営メッセージ 表示/非表示 命令受信時
	*/
	socket.on('info', function(msg) {
		if (msg == "on") {
			// 運営メッセージを表示する
			$('header').css('visibility', 'visible');
		} else if (msg == "off") {
			// 運営メッセージを非表示にする
			$('header').css('visibility', 'hidden');
		}
	});


	/**
	* 運営メッセージの書き換え命令受信時
	*/
	socket.on('header', function(msg) {
	//	$('header div').html(msg);
	});


	/* ---- */

	// フッターにランダムなメッセージを表示
	setMsg();

	// ドロップイベント発生時に呼び出す関数を設定
	droppable.bind("dragenter", cancelEvent);
	droppable.bind("dragover", cancelEvent);
	droppable.bind("drop", handleDroppedFile);


});
