//init
var chart ;
var dataUrl = "http://localhost:8888/StockData";
$("#searcher_date").val(new Date().toISOString().split("T")[0]);
//----------------------------------------------------------------------
// data generation
var data1 = generateChartData(new Date(),400, 5);
var data2 = generateChartData(new Date(),400, 5);
var datasets = {
	3301: data1,
	大立光: data1,
	3302: data2,
	小立光: data2
};


function generateChartData(date,minuteNum, interval) {
    // current date
    var firstDate = new Date('2016-11-02 9:00:00');
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
    var predict = (ref+rand + Math.random() * 4 - 2).toFixed(2);
	return {
        date: date,
        price: price,
        predict: predict
	};
}


(function(){
	// $.ajax({
	// 	url: dataUrl,
	// 	data: {
	// 		date: $('#searcher_date').val(),
	// 		symbol: 2454
	// 	},
	// 	type: "GET",
	// 	dataType: "json",
	// 	success: function(data){
	// 		console.log(data);
 //   		},
 //   		error:function (err){
 //   			console.log(err);
 //   		}

	// })
	// console.log("HIHI");
	$.get(
		dataUrl,
		{
			date: $('#searcher_date').val(),
			symbol: 2443
		},
		function(data){
			console.log("success!");
			console.log(data);
		});
})();

//----------------------------------------------------------------------
// chart init
d3.json("config/generalChart.json", (style) => {
	style.dataProvider = data1;
	chart = AmCharts.makeChart("chartdiv", style);
	chart.addListener('dataUpdated', zoomChart);
	zoomChart();

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
	}
	else{
    	chart.zoomToDates(oldStartDate, oldEndDate);
	}
}

//----------------------------------------------------------------------
$("#trackerInterval").on("change",()=>{
	zoomChart();
})
//----------------------------------------------------------------------
// for 3s a time loop
var refreshId = setInterval(()=>{
	var chartData = chart.dataProvider;
    var ref = parseFloat(chartData[chartData.length-2].price);
	var rand = Math.random() * 10 - 5;
    var price = (ref+rand).toFixed(2);
    chart.dataProvider[chartData.length-1].price = price;

	// update
    var newDate = new Date(chart.dataProvider[chart.dataProvider.length-1].date);
    newDate.setMinutes(newDate.getMinutes() + 5);
    // add data item to the array

    chart.dataProvider.push({
    	date: newDate,
    	predict: (ref+rand + Math.random() * 4 - 2).toFixed(2)
    });
	//

    oldStartDate = new Date(chart.startDate.getTime());
    oldStartDate.setDate(oldStartDate.getDate());
    oldEndDate = new Date(chart.endDate.getTime());
    oldEndDate.setDate(oldEndDate.getDate());
	chart.validateData();

	if(newDate.getHours() >= 17){
		clearInterval(refreshId);
	}

},3000);
//----------------------------------------------------------------------

$("#searcher").on("keydown",(event)=>{
	if(event.keyCode == 13){
		var searcher = document.getElementById("searcher");
		if(datasets[searcher.value]){
			chart.dataProvider = datasets[searcher.value];
			chart.validateData();
			document.getElementById("searchermsg").innerHTML = "";
		}
		else{
			document.getElementById("searchermsg").style.color = "red";
			document.getElementById("searchermsg").innerHTML = "沒有找到此股票！";
		}
	}
})

//----------------------------------------------------------------------
$("#searcher_date").on("change", function (){
	console.log(this.value);
})





