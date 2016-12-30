/**************************************************
 *              NOTE                              *
 **************************************************/
// lastTimeUpdate Need to be improve
// TODO: stockNameMsg.update => Recommend



/**************************************************
 *              FIRST INITIALZATION               *
 **************************************************/
var lineChart = new STOCKU.Chart("lineChartDiv", "line");
var candlestickChart = new STOCKU.Chart("candlestickChartDiv", "candlestick");
var searcherblock = new STOCKU.Searcher("searcherdiv");
var tracker = new STOCKU.Tracker("trackerdiv");
var idtable = STOCKU.LoadSettings("tables/idtable.json");
var timeScale = 1;
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
    var arr = STOCKU.JsonToArray(lineChart.jsonData);
    var currTime = new Date(arr[arr.length - 1].time);
    var nextTime = new Date(currTime);
    nextTime.setMinutes(currTime.getMinutes() + 1);

    var currPrice = STOCKU.randomDatum(arr[arr.length - 2].price, 5);
    var nextForecast = STOCKU.randomDatum(currPrice, 5);

    arr[arr.length - 1].price = currPrice;
    delete arr[arr.length - 1].bullet;
    var nextData = {time: nextTime, forecast: nextForecast, bullet:"round"};
    arr.push(nextData);
    STOCKU.addRMSE(arr);
    lineChart.updateJsonFromArray(arr);
    var accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData());
    var slope = STOCKU.TrendLine(lineChart.arrayData());
    $("#accuracyMsg").trigger("update", accuracySoFar);
    $("#closeMsg").trigger("update");
    $("#trendMsg").trigger("update", slope);
    $("#deltaMsg").trigger("update");
    $("#forecastMsg").trigger("update");


    $("#timeScale").trigger('modify',timeScale);
    console.log(lineChart.dataDateFormat);
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
$("#stockNameMsg").on("update", function(){
    var stockNum = searcherblock.$.input.val();
    this.innerHTML = stockNum ? idtable[stockNum] : "隨機";
});
$("#closeMsg").on("update", function(){
    this.innerHTML = "TWD$ "
    this.innerHTML += STOCKU.getLastElementAppear(lineChart.arrayData(),"price").element.price;
});
$("#deltaMsg").on("update", function(){
    var arr = lineChart.arrayData();
    var lastElement = STOCKU.getLastElementAppear(arr, "price");
    var delta = lastElement.element.price - arr[lastElement.index - 1].price;
    this.innerHTML = delta >= 0 ? '+'+ delta.toFixed(2) : delta.toFixed(2);
    this.style["background-color"] = delta >= 0 ? "green" : "red";
});

$("#trendMsg").on("update", function(event, slope){
    slope = slope || 0;
    this.innerHTML = (slope == 0 ? "持平" : slope > 0 ? "看漲" : "看跌") + "("+slope.toFixed(2)+")";
    this.style.color= slope > 0 ? "green" : slope < 0 ? "red" : "gray";
});

$("#forecastMsg").on("update", function(event){
    var forecast = STOCKU.getLastElementAppear(lineChart.arrayData(), "forecast").element.forecast;
    var price = STOCKU.getLastElementAppear(lineChart.arrayData(), "price").element.price;
    var delta = forecast - price;
    this.style.color = "white";
    this.style["background-color"] = ( delta > 0) ? "rgba(0, 125, 0, 0.5)" : (delta < 0 ) ? "rgba(255,0, 0, 0.5)" : "gray";
    this.innerHTML = ( delta > 0) ? "可買進" : (delta < 0 ) ? "可賣出" : "持有";
});


$("#accuracyMsg").on("update", function(event, val){
    val *= 100;
    var bgcolor;
    switch(true){
        case val < 60: bgcolor = "rgba(0, 0, 0, 0.5)";break;
        case val < 70: bgcolor = "rgba(255,0, 0, 0.5)";break;
        case val <= 80: bgcolor = "rgba(255, 125, 0, 0.5)";break;
        default: bgcolor = "rgba(0, 125, 0, 0.5)";break;
    }
    this.style["background-color"] = bgcolor;
    this.style.color = "white";
    this.innerHTML = val.toFixed(2) + "%";
});

$("#timeScale").on("modify",function(event, val){
    timeScale = val;
    var arr = STOCKU.JsonToArray(lineChart.jsonData);
    var timeScaleArr = STOCKU.TimeScale(arr,val);
    lineChart.arrayData(timeScaleArr);
    lineChart.validateData();
    // console.log(arr)
    candlestickChart.arrayData(STOCKU.ToOhlc(arr, val,"min"));
    candlestickChart.validateData();

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
                var slope = STOCKU.TrendLine(lineChart.arrayData());
                $("#stockNameMsg").trigger("update");
                $("#trendMsg").trigger("update", slope);
                $("#deltaMsg").trigger("update");
                $("#closeMsg").trigger("update");
                return getForecast(stock, date);
		    },
		    (response) =>getForecast(stock, date)
		)
		.then(
		    (data) => {
                lineChart.addJsonData(data)
                STOCKU.addRMSE(lineChart.arrayData());
                var accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData());
                $("#accuracyMsg").trigger("update", accuracySoFar);
                $("#forecastMsg").trigger("update");

                lineChart.updateJsonFromArray();
                lineChart.validateData();
                candlestickChart.validateData();

                tracker.track();
            }
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


STOCKU.TrendLine(lineChart.arrayData());

// var accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData());
// $("#logmsg").trigger("add", ["準確率: " + accuracySoFar, "green"]);
STOCKU.FetchNews();
$("#stockNameMsg").trigger("update");
$("#deltaMsg").trigger("update");

// set Interval
var refreshId = setInterval(() => {
    genNewData();
}, 3000);
//--------------------------------------------------
