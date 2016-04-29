var http = require('http');

module.exports = {


	/**
	 * ランダム画像の取得
	 * @param  {Function} callback コールバック関数 function({Buffer} buf)
	 */
	getRandomImage: function (callback) {

		var req = http.get('http://lorempixel.com/640/480/food/', function (res) {

			var data = [];

			res.on('data', function (chunk) {
				data.push(chunk);
			});

			res.on('end', function () {
				var buf = (res.statusCode === 200) ? Buffer.concat(data) : null;
				callback(buf);
			});

		});

		req.setTimeout(6000, function () {
			console.log('Could not get a random image - timeout');
			req.abort();
		});

		req.on('error', function(e) {
			console.log('Could not get a random image');
			callback(null);
		});

	}


};
