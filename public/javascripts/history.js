/**************************************************
 *              NOTE                              *
 **************************************************/



/**************************************************
 *              FIRST INITIALZATION               *
 **************************************************/
var lineChart = new STOCKU.Chart("lineChartDiv", "line");
var candlestickChart = new STOCKU.Chart("candlestickChartDiv","candlestick");
var searcherblock = new STOCKU.SearcherWithDate("searcherdiv");


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
    lineChart.validateData();
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
searcherblock.searcher.search = function (){
    // clear data
    lineChart.jsonData = {};
    var stock = searcherblock.$.input.val();
    var date = searcherblock.$.date.val();
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
            (data) =>{
                lineChart.addJsonData(data);
                STOCKU.addRMSE(lineChart.arrayData());
                var accuracySoFar = STOCKU.addAccuracy(lineChart.arrayData());
                $("#logmsg").trigger("set", ["準確率: " + accuracySoFar, "green"]);
                lineChart.validateData();
            },
            (response)=> 0
        );
}

/**************************************************
 *              MAIN                              *
 **************************************************/
// set up searcher block
searcherblock.$.input.val(1232);
searcherblock.$.date.val("2016-11-23");
searcherblock.$.button.mouseup();
lineChart.validateData();

// //--------------------------------------------------

// // Random Data
// $("#logmsg").trigger("set", ["此為隨機產生之資料", "purple"]);
//
// var priceData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 13:00:00", "price", 1, "min");
// var forecastData = STOCKU.genJsonData("2016-11-07 09:00:00", "2016-11-07 13:01:00", "forecast", 1, "min", 4, priceData, "price");
// priceData = STOCKU.ObjectCombine(priceData, forecastData);
// lineChart.addJsonData(priceData);
// STOCKU.addRMSE(lineChart.arrayData());
// candlestickChart.arrayData(STOCKU.ToOhlc(lineChart.arrayData(), 5, "min"));
