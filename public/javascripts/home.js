/**************************************************
 *              INIT                              *
 **************************************************/
var chart = new CHART.SerialChart("chartdiv");

// random 產生
var priceData = CHART.genDataJSON({},"9:00:00", 1, "10:00:00","price");
var forecastData = CHART.genDataJSON(priceData , "9:01:00", 1, "10:01:00","forecast");
chart.addJSON(priceData);
chart.addJSON(CHART.calcAccuracy(priceData,1));

chart.validateData();


chart.addLegend(new CHART.Legend(),"legenddiv");
var searcherblock = chart.searcherblock = new CHART.Searcher("searcherdiv");
var tracker = chart.tracker = new CHART.Tracker("trackerdiv", chart);
tracker.track();



/**************************************************
 *              EVENT                             *
 **************************************************/

// -----------------------------------------------------
// Event handler
$("#msg").on("set", function (event, msg, color){
	var msg = '<div style="color:'+ color +'">' + msg + '</div>'
	this.innerHTML = msg;
})

$("#msg").on("add", function(event, msg, color){
	var msg = '<div style="color:'+ color +'">' + msg + '</div>'
	this.innerHTML = this.innerHTML + "<br>" + msg;
});

// -----------------------------------------------------
// update Function
function getNewData(){
	var stock = searcherblock.$.input.val();
	var date = searcherblock.$.date.val();
	$.get("/StockData/price", {
			stock: stock,
			date: date,
			lastTimeUpdate: lastTimeUpdate,
		},
		(response) => {
			if (response.msg == 'DataFound') {
				$("#msg").trigger("set", ["已找到股票(" + stock + ")！", "green"]);
				chart.setJSON(response.content);
				lastTimeUpdate = (new Date()).getTime();
			}
			else if(response.msg == 'AlreadyUpdate'){
				$("#msg").trigger("set", ["資料已是最新", "blue"]);
			}
			else {
				$("#msg").trigger("set", ["沒有找到此股票(" + stock + ")！", "red"]);
			}
		}
	);
	$.get("/StockData/forecast", {
			stock: stock,
			date: date,
			lastTimeUpdate: lastTimeUpdate,
		},
		(response) => {
			if (response.msg == 'DataFound') {
				$("#msg").trigger("add", ["已找到股票預測資料(" + stock + ")！", "green"]);
				chart.addJSON(response.content);
				chart.addJSON(CHART.calcAccuracy(chart.jsonData(),1));
				chart.validateData();
			}
			else if(response.msg == 'AlreadyUpdate'){
				$("#msg").trigger("add", ["預測資料已是最新","blue"]);
			}
			else {
				$("#msg").trigger("add", ["沒有找到此股票預測資料(" + stock + ")！","red"]);
			}
		}
	);

}

// searchFunction override
var lastTimeUpdate;
searcherblock.searchFunction = function (){
	lastTimeUpdate = undefined;
	getNewData();
}


// -----------------------------------------------------
// set
$("#msg").trigger("set", ["此為隨機產生之資料", "purple"]);
// searcherblock.$.input.val(2498);
// searcherblock.$.date.val("2016-11-07");
// searcherblock.$.button.mouseup();


/**************************************************
 *              GAME LOOP                         *
 **************************************************/

// for 3s a time loop update server's data
// var refreshId = setInterval(()=>{
// 	getNewData();
// },3000);

// -----------------------------------------------------

// for 3s a time loop update random data
var refreshId = setInterval(()=>{
	var arr = chart.arrayData();
	var lastData = arr[arr.length - 1];
	// Price
	var currForecast = lastData.forecast;
	var currPrice = arr[arr.length - 2].price + (Math.random() *10 - 5);
	var nextForecast = currPrice + (Math.random() *10 - 5);

	currPrice = parseFloat(currPrice.toFixed(2));
	nextForecast = parseFloat(nextForecast.toFixed(2));

	// Time
	var currTime = new Date(lastData.time);
	var nextTime = new Date(lastData.time);
	nextTime.setMinutes(nextTime.getMinutes() + 1);
	currTime = currTime.yyyymmddHHMMSS();
	nextTime = nextTime.yyyymmddHHMMSS();

	// new Data
	var newData = {};
	newData[arr[arr.length - 2].time] = arr[arr.length - 2];
	newData[currTime] = {price: currPrice, forecast: currForecast};
	newData[nextTime] = {forecast: nextForecast};

	chart.addJSON(newData);
	chart.addJSON(CHART.calcAccuracy(newData, 1));
	chart.validateData();
	tracker.track();

}, 3000);

