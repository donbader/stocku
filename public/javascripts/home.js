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
    console.log("Getting Price...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/price", {
                stock: stock,
                date: date
            })
            .done((response) => {
                if (response.msg == "DataFound")
                    resolve(response.content);
                else if (response.msg == "DataNotFound") {
                    reject(response);
                }
            })
            .fail(() => {
                reject("[getPrice] Error!");
            });
    });
}


function getForecast(stock, date) {
    console.log("Getting Forecast...");
    return new Promise((resolve, reject) => {
        $.get("/StockData/forecast", {
                stock: stock,
                date: date
            })
            .done((response) => {
                if (response.msg == "DataFound")
                    resolve(response.content);
                else if (response.msg == "DataNotFound") {
                    reject(response);
                }

            })
            .fail(() => {
                reject("[getPrice] Error!");
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
		        $("#logmsg").trigger("set", ["找到價錢資料", "green"]);
		        return getForecast(stock, date);
		    },
		    (response) =>{
		        $("#logmsg").trigger("set", ["沒有找到價錢資料", "red"]);
		        return getForecast(stock, date);
		    }
		)
		.then(
		    (data) => {
		        chart.addJsonData(data);
		        // 準確率計算
		        chart.addJsonData(STOCKU.calcAccuracy(chart.jsonData, 1));
		        $("#logmsg").trigger("add", ["找到預測資料", "green"]);
		        tracker.track();
		    },
		    (response) =>{
		        $("#logmsg").trigger("add", ["沒有找到預測資料", "red"]);
		    }
		)


}

/**************************************************
 *              MAIN                              *
 **************************************************/
// set up searcher block
searcherblock.$.input.val(2454);
searcherblock.$.button.mouseup();
tracker.$.input.val(20);
//--------------------------------------------------

// Random Data
// Random Data
// var priceData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 10:00:00", "price", 1, "min");
// var forecastData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 10:01:00", "forecast", 1, "min", 4, priceData, "price");
// priceData = STOCKU.ObjectCombine(priceData, forecastData);

// var accuracyData = STOCKU.calcAccuracy(priceData, 1);
// chart.addJsonData(forecastData);
// chart.addJsonData(priceData);
// chart.addJsonData(accuracyData);
// $("#logmsg").trigger("set", ["此為隨機產生之資料", "purple"]);







