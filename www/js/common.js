$(function () {

	var socket = io();

	var setMsg = function () {

		var msg = new Array();
		msg[0] = 'できたてホカホカの美味しい ソフトウェアとサービスを。';
		msg[1] = '”こういうツールがあったら便利かも”というアイデアがあったら是非教えてください。';
		msg[2] = 'プロジェクトのソースコードを公開しています: <a href="https://github.com/odentools" target="_blank">GitHub</a>';
		msg[3] = 'ご興味をお持ちの方は、Twitter の <a href="https://twitter.com/odentools" target="_blank">@odentools</a> へお気軽にMentionsをお送りいただければ幸いです！';

		var msgNo = Math.floor(Math.random() * msg.length);
		$('#msg').html(msg[msgNo]);

	};

	var sendMsg = function () {
		
		var textMsg = $('#textBox').val();
		
		if (textMsg == "") {
			return false;
		}

		if (navigator.platform.indexOf("Win") != -1) {

			for(var i = 0, leni=textMsg.length; i < leni; i++) {
				if(textMsg.charCodeAt(i) >= 3586 && textMsg.charCodeAt(i) <=3675) {
					$('#textBox').val('');
					return false;
				}
			}
			
		}

		socket.emit('newMessage', { body: textMsg, color: $('#color').val() });
		$('#textBox').val('');
		return false;

	};
	
	var getTime = function() {
		
		var nowTime = new Date();
		var hour = nowTime.getHours() < 10 ? '0' + nowTime.getHours() : nowTime.getHours();
		var minute = nowTime.getMinutes() < 10 ? '0' + nowTime.getMinutes() : nowTime.getMinutes();
		var second = nowTime.getSeconds() < 10 ? '0' + nowTime.getSeconds() : nowTime.getSeconds();
		
		return (hour + ':' + minute + ':' + second);

	};
	
	var addProcessing = function(hash, id) {
		var iframeDom = '<iframe src="pde.html?pdeName='+hash+'" name="pfeFile">';
		$('#chatArea').prepend($('<tr><td>' + getTime() + '<td>' + id + '<td>'+iframeDom+'</tr>'));
	};

	$('#send').click(function () {
		if (sendMsg()) return false;
	});

	$('#textBox').keydown(function (e) {
		if (e.keyCode === 13) {
			if (sendMsg()) return false;
		}
	});

	$('#iSeeCount').click(function () {
		socket.emit('iSeeCount');
	});

	socket.on('newMessage', function (msg) {
		$('#chatArea').prepend($('<tr><td>' + getTime() + '<td>' + msg.id + '<td>' + msg.body + '</tr>'));
		nicoscreen.add(msg.body, msg.color);
	});

	socket.on('graphUupdate', function(msg) {
		viewers = msg.viewers;
		iSeeCount = msg.iSeeCount;
	});
	
	socket.on('pdeFile', function(msg) {
		addProcessing(msg.hash, msg.id);
	});

	socket.on('info', function(msg) {
		if (msg == "on") {
			$('header').css('visibility', 'visible');
		} else if(msg == "off") {
			$('header').css('visibility', 'hidden');
		}
	});

	socket.on('header', function(msg) {
		$('header div').html(msg);
	});

	setMsg();
	nicoscreen.start();

	var droppable = $("#nicoscreen");

	if (!window.FileReader) {
		console.log("File API がサポートされていません。");
		return false;
	}

	var cancelEvent = function (event) {
		event.preventDefault();
		event.stopPropagation();
		return false;
	}

	droppable.bind("dragenter", cancelEvent);
	droppable.bind("dragover", cancelEvent);

	var handleDroppedFile = function (event) {
		// ファイルは複数ドロップされる可能性がありますが, ここでは 1 つ目のファイルを扱います.
		var file = event.originalEvent.dataTransfer.files[0];

		var fileReader = new FileReader();
		fileReader.onload = function (event) {

			var reg=/(.*)(?:\.([^.]+$))/;
			if( file.name.match(reg)[2] != 'pde')
				return false;

			var source = event.target.result;
			source = source.replace( /size(.*);/g, "size(500, 500);" );

			socket.emit('pdeFile', source);
		
		}

		fileReader.readAsText(file);

		cancelEvent(event);
		return false;

	}

	droppable.bind("drop", handleDroppedFile);

});