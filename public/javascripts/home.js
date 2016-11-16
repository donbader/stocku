// -----------------------------------------------------
// init
var chart = new CHART.SerialChart("chartdiv");

// random 產生
// var priceData = CHART.genDataJSON({},"9:00:00", 1, "10:00:00","price");
// var forecastData = CHART.genDataJSON(priceData , "9:01:00", 1, "10:01:00","forecast");
// CHART.addAccuracy(priceData, 1);
// chart.addJSON(priceData);
// chart.validateData();


chart.addLegend(new CHART.Legend(),"legenddiv");
var trackerblock = chart.trackerblock = new CHART.Tracker("trackerdiv", chart);
var searcherblock = chart.searcherblock = new CHART.SearcherWithDate("searcherdiv");



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
				CHART.addAccuracy(chart.json, 1);
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
searcherblock.searcher.searchFunction = function (){
	lastTimeUpdate = undefined;
	getNewData();
}


// -----------------------------------------------------
// set
$("#msg").trigger("set", ["此為隨機產生之資料", "purple"]);
searcherblock.$.input.val(2498);
searcherblock.$.date.val("2016-11-07");
searcherblock.$.button.mouseup();


// -----------------------------------------------------
// loop

// for 3s a time loop update server's data
var refreshId = setInterval(()=>{
	getNewData();
},3000);

// -----------------------------------------------------

// for 3s a time loop update random data


