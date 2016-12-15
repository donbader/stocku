/**************************************************
 *              NOTE                              *
 **************************************************/
// lastTimeUpdate Need to be improve



/**************************************************
 *              FIRST INITIALZATION               *
 **************************************************/
var lineChart = new STOCKU.Chart("lineChartDiv", "line");
var candlestickChart = new STOCKU.Chart("candlestickChartDiv", "candlestick");
var searcherblock = new STOCKU.Searcher("searcherdiv");
var tracker = new STOCKU.Tracker("trackerdiv");
/**************************************************
 *              GLOBAL FUNCTION                   *
 **************************************************/
 function getPrice(stock, date) {
     var lastTimeUpdate = (stock == searcherblock.state.price) ?
                            searcherblock.state.price.updateTime : undefined;
     log("Getting Price...");
     return new Promise((resolve, reject) => {
         $.get("/StockData/price", {
                 stock: stock,
                 date: date,
                 lastTimeUpdate: lastTimeUpdate
             })
             .done((response) => {
                 if (response.msg == "DataFound"){
                     $("#logmsg").trigger("set", ["找到價錢資料", "green"]);
                     searcherblock.state.price = {
                         updateTime:new Date().getTime(),
                         stock: stock
                     };
                     resolve(response.content);
                 }
                 else if (response.msg == "DataNotFound") {
                     $("#logmsg").trigger("set", ["沒有找到價錢資料", "red"]);
                     searcherblock.state.price = {
                         updateTime:undefined,
                         stock: stock
                     };
                     reject(response);
                 }
                 else{
                     $("#logmsg").trigger("set", ["價錢資料已是最新", "blue"]);
                     reject(response);
                 }
             })
             .fail((response) => {
                 reject(response);
             });
     });
 }


 function getForecast(stock, date) {
     var lastTimeUpdate = (stock == searcherblock.state.forecast) ?
                            searcherblock.state.forecast.updateTime : undefined;

     log("Getting Forecast...");
     return new Promise((resolve, reject) => {
         $.get("/StockData/forecast", {
                 stock: stock,
                 date: date,
                 lastTimeUpdate: lastTimeUpdate
             })
             .done((response) => {
                 if (response.msg == "DataFound"){
                     $("#logmsg").trigger("add", ["找到預測資料", "green"]);
                     searcherblock.state.forecast = {
                         updateTime:new Date().getTime(),
                         stock: stock
                     };
                     resolve(response.content);
                 }
                 else if (response.msg == "DataNotFound") {
                     $("#logmsg").trigger("add", ["沒有找到預測資料", "red"]);
                     searcherblock.state.forecast = {
                         updateTime:undefined,
                         stock: stock
                     };
                     reject(response);
                 }
                 else{
                     $("#logmsg").trigger("add", ["預測資料已是最新", "blue"]);
                     reject(response);
                 }
             })
             .fail((response) => {
                 reject(response);
             });
     });
 }


tracker.track = function(){
	if(this.$.checkbox.prop("checked")){
		var data = lineChart.arrayData();
		var end = new Date(data[data.length - 1].time);
		var start = new Date(end);

		start.setMinutes(end.getMinutes() - this.$.input.val() - 1);
		end.setMinutes(end.getMinutes() + 1);
        lineChart.zoomToDates(start, end);
		candlestickChart.zoomToDates(start, end);
	}
	else{
		// zoom to old Date;
        lineChart.zoomToDates(lineChart.prevStartTime, lineChart.prevEndTime);
		candlestickChart.zoomToDates(candlestickChart.prevStartTime, candlestickChart.prevEndTime);
	}
}

function genNewData (){
    var arr = lineChart.arrayData();
    var currTime = new Date(arr[arr.length - 1].time);
    var nextTime = new Date(currTime);
    nextTime.setMinutes(currTime.getMinutes() + 1);

    var currPrice = STOCKU.randomDatum(arr[arr.length - 2].price, 5);
    var nextForecast = STOCKU.randomDatum(currPrice, 5);

    arr[arr.length - 1].price = currPrice;
    var nextData = {time: nextTime, forecast: nextForecast};
    arr.push(nextData);

    STOCKU.addRMSE(arr);
    candlestickChart.arrayData(STOCKU.ToOhlc(lineChart.arrayData(), 5, "min"));
    lineChart.validateData();
    candlestickChart.validateData();
    tracker.track();

}


/**************************************************
 *              DEBUG FUNCTION                    *
 **************************************************/
//If you wanna disable debugging, make var enable_debug
//false !!
var enable_debug = true;
//--------------------------------------------------
function log(msg, debug = true) {
    if (debug && enable_debug)
        console.log(msg);
}
/**************************************************
 *              DEPLOY EVENT                      *
 **************************************************/

$("#logmsg").on("set", function(event, msg, color) {
    var msg = '<div style="color:' + color + '">' + msg + '</div>'
    this.innerHTML = msg;
})

$("#logmsg").on("add", function(event, msg, color) {
    var msg = '<div style="color:' + color + '">' + msg + '</div>'
    this.innerHTML = this.innerHTML + "<br>" + msg;
});

// Override search();
searcherblock.search = function (){
	// clear data
	lineChart.jsonData = {};
    var stock = searcherblock.$.input.val();
    var date = new Date().yyyymmdd();
	getPrice(stock, date)
		.then(
		    (data) => {
                lineChart.addJsonData(data);
                candlestickChart.arrayData(STOCKU.ToOhlc(lineChart.arrayData(), 5,"min"));
                return getForecast(stock, date);
		    },
		    (response) =>getForecast(stock, date)
		)
		.then(
		    (data) => {
                lineChart.addJsonData(data)
                STOCKU.addRMSE(lineChart.arrayData());
                var accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData());
                $("#logmsg").trigger("set", ["準確率: " + accuracySoFar, "green"]);
                lineChart.validateData();
                candlestickChart.validateData();
                tracker.track();
            },
            (response)=> 0
		);
}

/**************************************************
 *              MAIN                              *
 **************************************************/
// set up searcher block
// searcherblock.$.input.val(1101);
// tracker.$.input.val(20);
// searcherblock.$.button.mouseup();
//
// var refreshId = setInterval(() => {
//     searcherblock.search();
// }, 3000);
//--------------------------------------------------

// Random Data
$("#logmsg").trigger("set", ["此為隨機產生之資料", "purple"]);
var priceData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 10:00:00", "price", 1, "min");
var forecastData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 10:01:00", "forecast", 1, "min", 4, priceData, "price");
priceData = STOCKU.ObjectCombine(priceData, forecastData);

lineChart.addJsonData(priceData);
STOCKU.addRMSE(lineChart.arrayData());
candlestickChart.arrayData(STOCKU.ToOhlc(lineChart.arrayData(), 5, "min"));


// set Interval
var refreshId = setInterval(() => {
    genNewData();
    accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData());
    $("#logmsg").trigger("set", ["準確率: " + accuracySoFar, "green"]);
}, 3000);
//--------------------------------------------------
