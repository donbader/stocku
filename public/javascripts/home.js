/**************************************************
 *              NOTE                              *
 **************************************************/
// lastTimeUpdate Need to be prove



/**************************************************
 *              FIRST INITIALZATION               *
 **************************************************/
var chart = new STOCKU.ChartInMinuteScale("chartdiv");
var searcherblock = new STOCKU.Searcher("searcherdiv");
var tracker = new STOCKU.Tracker("trackerdiv");

/**************************************************
 *              GLOBAL FUNCTION                   *
 **************************************************/
function getPrice(stock, date) {
    var lastTimeUpdate = STOCKU.lastTimeAppear(chart.arrayData(), "price");

    console.log("Getting Price...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/price", {
                stock: stock,
                date: date,
                lastTimeUpdate: lastTimeUpdate
            })
            .done((response) => {
                if (response.msg == "DataFound"){
                    $("#logmsg").trigger("set", ["找到價錢資料", "green"]);
                    resolve(response.content);
                }
                else if (response.msg == "DataNotFound") {
                    $("#logmsg").trigger("set", ["沒有找到價錢資料", "red"]);
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
    var lastTimeUpdate = STOCKU.lastTimeAppear(chart.arrayData(), "forecast");

    console.log("Getting Forecast...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/forecast", {
                stock: stock,
                date: date,
                lastTimeUpdate: lastTimeUpdate
            })
            .done((response) => {
                if (response.msg == "DataFound"){
                    $("#logmsg").trigger("add", ["找到預測資料", "green"]);
                    resolve(response.content);
                }
                else if (response.msg == "DataNotFound") {
                    $("#logmsg").trigger("add", ["沒有找到預測資料", "red"]);
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
		var data = chart.arrayData();
		var end = new Date(data[data.length - 1].time);
		var start = new Date(end);

		start.setMinutes(end.getMinutes() - this.$.input.val() - 1);
		end.setMinutes(end.getMinutes() + 1);
		chart.zoomToDates(start, end);
	}
	else{
		// zoom to old Date;
		chart.zoomToDates(chart.prevStartTime, chart.prevEndTime);
	}
}

function genNewData (){
    var arr = chart.arrayData();
    var currTime = new Date(arr[arr.length - 1].time);
    var nextTime = new Date(currTime);
    nextTime.setMinutes(currTime.getMinutes() + 1);

    var currPrice = STOCKU.randomDatum(arr[arr.length - 2].price, 5);
    var nextForecast = STOCKU.randomDatum(currPrice, 5);

    arr[arr.length - 1].price = currPrice;
    var nextData = {time: nextTime, forecast: nextForecast};
    arr.push(nextData);

    STOCKU.addAccuracy(arr);
    chart.validateData();
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
	chart.jsonData = {};
    var stock = searcherblock.$.input.val();
    var date = new Date().yyyymmdd();
	getPrice(stock, date)
		.then(
		    (data) => {
                chart.addJsonData(data);
                return getForecast(stock, date);
		    },
		    (response) =>getForecast(stock, date)
		)
		.then(
		    (data) => chart.addJsonData(data),
            (response)=> 0
		)
        .then(
            ()=>{
                // 準確率計算
                STOCKU.addAccuracy(chart.arrayData())
                chart.validateData();
                tracker.track();
            }
        );
}

/**************************************************
 *              MAIN                              *
 **************************************************/
// set up searcher block
searcherblock.$.input.val(2498);
tracker.$.input.val(20);
searcherblock.$.button.mouseup();

// var refreshId = setInterval(() => {
//     searcherblock.search();
// }, 3000);
//--------------------------------------------------

// Random Data
// var priceData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 10:00:00", "price", 1, "min");
// var forecastData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 10:01:00", "forecast", 1, "min", 4, priceData, "price");
// priceData = STOCKU.ObjectCombine(priceData, forecastData);

// var accuracyData = STOCKU.calcAccuracy(priceData, 1);
// chart.addJsonData(forecastData);
// chart.addJsonData(priceData);
// chart.addJsonData(accuracyData);
// $("#logmsg").trigger("set", ["此為隨機產生之資料", "purple"]);

// set Interval
// var refreshId = setInterval(() => {
//     genNewData();
// }, 3000);
//--------------------------------------------------



