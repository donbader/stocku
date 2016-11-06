//init
var chart ;
var dataToDisplay;
$("#searcher_date").val(new Date().toISOString().split("T")[0]);
//----------------------------------------------------------------------
// random gen function
function generateChartData(date,minuteNum, interval) {
    // current date
    var firstDate = date;
    var chartData = [{date:firstDate, price:"100"}];


    // and generate 500 data items
    for (var i = 5; i <= minuteNum; i+=interval) {
        var newDate = new Date(firstDate);
        // each time we add one minute
        newDate.setMinutes(newDate.getMinutes() + i);


        // add data item to the array
        if(chartData[newDate]){
        	chartData[newDate] = genDatum(chartData, newDate);
        }
        else{
        	chartData.push(genDatum(chartData, newDate));
    	}
    }
    return chartData;
}

function genDatum(chartData, date){
    // some random number
    var ref = parseFloat(chartData[chartData.length-1].price);
	var rand = Math.random() * 10 - 5;
    var price = (ref+rand).toFixed(2);
    var forecast = (ref+rand + Math.random() * 4 - 2).toFixed(2);
	return {
        date: date,
        price: price,
        forecast: forecast
	};
}


//----------------------------------------------------------------------
// can be modified to Recommend
dataToDisplay = generateChartData(new Date(),400, 5);

// chart init
d3.json("config/generalChart.json", (style) => {
	chart = AmCharts.makeChart("chartdiv", style);
	chart.addListener('dataUpdated', zoomChart);
	// chart.dataProvider = dataToDisplay;
	// chart.validateData();

	// init as #searcher value
	$("#searcher").focus().focusout();
});





// event handler
//----------------------------------------------------------------------
// zoom
var oldStartDate, oldEndDate;
function zoomChart(){
	if(document.getElementById('tracker').checked){
		var interval = document.getElementById('trackerInterval').value;
		var lastDate = new Date(chart.dataProvider[chart.dataProvider.length-1].date);
		var startDate = new Date(lastDate)
		startDate.setMinutes(startDate.getMinutes() - interval - 5);
		lastDate.setMinutes(lastDate.getMinutes() + 5);
		chart.zoomToDates(startDate,lastDate);
		recordDate();
	}
	else{
    	chart.zoomToDates(oldStartDate, oldEndDate);
	}
}
// record last value
function recordDate(){
    oldStartDate = new Date(chart.startDate);
    oldEndDate = new Date(chart.endDate);
}


//----------------------------------------------------------------------
$("#trackerInterval").on("change",()=>{
	zoomChart();
})

//----------------------------------------------------------------------
// #searcher event
$("#searcher").on("keydown", function (event){
	if(event.keyCode == 13){
		var stock = this.value;
		var date = $("#searcher_date").val().split('-').join('');
		searchHandler(stock, date);
	}
})
$("#searcher").on("focusout",function(){
	var stock = this.value;
	var date = $("#searcher_date").val().split('-').join('');
	searchHandler(stock, date);
})

//----------------------------------------------------------------------
// #searcher_date event
$("#searcher_date").on("focusout", function (){
	var stock = $("#searcher").val();
	var date = this.value.split('-').join('');
	// find the data
	searchHandler(stock,date);
})
//----------------------------------------------------------------------
function searchHandler(stock_num, date){
	d3.csv(date+'_'+stock_num+'.csv', (priceData)=>{
		if(!priceData){
			$("#searchermsg").trigger("DataNotFound", "沒有找到此股票("+stock_num+")！");
		}
		else{
			$("#searchermsg").trigger("DataFound", "");
			// clear dataToDisplay
			dataToDisplay = [];
			// push data
			priceData.forEach((element)=>{
				if(!element.date)return;
				dataToDisplay.push({
					date: element.date,
					price: element.price
				});
			});

			d3.csv(date+'_'+stock_num+'.forecast.csv', (forecastData)=>{
				if(!forecastData){
					$("#searchermsg").trigger("DataNotFound", "此股票("+stock_num+")沒有預測之資料！");
				}
				else{
					$("#searchermsg").trigger("DataFound", "");
					forecastData.forEach((element)=>{
						if(!element.date)return;
						var exists = dataToDisplay.findIndex((elementPrice)=>{
							return elementPrice.date == element.price;
						});
						if(exists != -1){
							dataToDisplay[indexInData].forecast = element.price;
						}
						else{
							dataToDisplay.push({
								date: element.date,
								forecast: element.price
							})
						}
					});
				}
				chart.dataProvider = dataToDisplay;
				chart.validateData();
			})
		}
	});
}
//----------------------------------------------------------------------
// data not found event
$("#searchermsg").on('DataNotFound', (event, msg)=>{
	console.log('Data not found!');
	$("#searchermsg").css('color','red');
	$("#searchermsg").html(msg);
})
// data found event
$("#searchermsg").on('DataFound', (event, msg)=>{
	$("#searchermsg").css('color','green');
	$("#searchermsg").html(msg);
});
//----------------------------------------------------------------------
// for 3s a time loop
// var refreshId = setInterval(()=>{
// 	var stock = $("#searcher").val();
// 	var date = $("#searcher_date").val().split('-').join('');
// 	// for zooming
// 	recordDate();
// 	searchHandler(stock, date);
// },3000);


