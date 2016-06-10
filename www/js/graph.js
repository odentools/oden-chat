/**
 * グラフ描画関係のJSファイル
 */

var viewers = 0,
    iSeeCount = 0;

$(function() {

    var updateInterval = 30;
    var totalPoints = 300;
    var viewersData = [],
        iSeeCountData = [];

    // 閲覧者数グラフデータを作成
    function getViewersData() {

        // 先頭のデータを削除
        if (viewersData.length > 0)
            viewersData = viewersData.slice(1);

        // グラフが一定数になるように処理
        while (viewersData.length < totalPoints) {
            viewersData.push(viewers);
        }

        var res = [];
        for (var i = 0; i < viewersData.length; ++i) {
            res.push([i, viewersData[i]]);
        }

        return res;
    };

    // なるほどグラフデータを作成
    function getISeeCountData() {

        // 先頭のデータを削除
        if (iSeeCountData.length > 0)
            iSeeCountData = iSeeCountData.slice(1);

        // グラフが一定数になるように処理
        while (iSeeCountData.length < totalPoints) {
            iSeeCountData.push(iSeeCount);
        }

        var res = [];
        for (var i = 0; i < iSeeCountData.length; ++i) {
            res.push([i, iSeeCountData[i]]);
        }

        return res;
    };

    var viewersGraph = $.plot("#viewersGraph", [getViewersData()], {
        series: {
            shadowSize: 0
        },
        yaxis: {
            min: 0,
            max: 100
        },
        xaxis: {
            show: false
        }
    });

    var iSeeCountGraph = $.plot("#iSeeCountGraph", [getISeeCountData()], {
        series: {
            shadowSize: 0
        },
        yaxis: {
            min: 0,
            max: 100
        },
        xaxis: {
            show: false
        }
    });

    function graphUupdate() {
        viewersGraph.setData([getViewersData()]);
        iSeeCountGraph.setData([getISeeCountData()]);

        viewersGraph.draw();
        iSeeCountGraph.draw();

        setTimeout(graphUupdate, updateInterval);
    };

    graphUupdate();

});
