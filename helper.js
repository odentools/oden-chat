var http = require('http');

module.exports = {


	/**
	 * ランダム画像の取得
	 * @param  {Function} callback コールバック関数 function({Buffer} buf)
	 */
	getRandomImage: function (callback) {

		http.get( 'http://lorempixel.com/640/480/food/', function (res) {

			var data = [];

			res.on('data', function (chunk) {
				data.push(chunk);
			});

			res.on('end', function () {
				var buf = (res.statusCode === 200) ? Buffer.concat(data) : null;
				callback(buf);
			});

		});

	}


};
