(function(global, factory) {
	if (global.CHART === undefined) {
		global.CHART = factory();
		global.CHART.init();
	}
}(window, function() {
	'use strict';
	var CHART = {
		init : function(){},
		genDataJSON: function(chartData,startString, interval, endString, elementName, bias){
			chartData = chartData || {};
			startString = startString || "09:00:00";
			interval = interval || 1;
			endString = endString || "12:59:00";
			elementName = elementName || "price";
			bias = bias || 5;

			var start = new Date()
				,end = new Date();
			startString = startString.split(":");
			endString = endString.split(":");
			start.setHours(parseInt(startString[0])
							,parseInt(startString[1])
							,parseInt(startString[2]));
			end.setHours(parseInt(endString[0])
							,parseInt(endString[1])
							,parseInt(endString[2]));

			chartData[start] = chartData[start] || {};
			chartData[start][elementName] = Math.random()*25+75;

			var currTime = new Date(start);
			var nextTime = new Date(start);
			for(var i=0; nextTime < end; i+=interval){
				currTime.setMinutes(start.getMinutes() + i);
				nextTime.setMinutes(currTime.getMinutes() + interval);

				chartData[nextTime] = chartData[nextTime] || {};
				switch(elementName){
					case "price":
						chartData[nextTime][elementName] = this.randomDatum(chartData[currTime][elementName], bias);
					case "forecast":
						chartData[nextTime][elementName] = this.randomDatum(chartData[currTime]["price"], bias);
				}
			}


			return chartData;
		},
		randomDatum: function(ref, bias){
			ref = ref || 100;
			bias = bias || 10;
			var rand = Math.random() * 2*bias - bias;
			return parseFloat((ref + rand).toFixed(2));
		},
		JsonToArray: function(obj){
			var arr = [];
			for(var prop in obj){
				arr.push({time: prop});
				for(var inner in obj[prop]){
					arr[arr.length - 1][inner] = obj[prop][inner];
				}
			}
			return arr;
		},
		addAccuracy: function(data, interval){
			var interval = interval || 1;
			var total = 0;
			var size = 0;
			for(var prop in data){
				if(!data[prop].price || !data[prop].forecast)
					continue;
				var prevTime = new Date(prop);
				var currTime = new Date(prop);
				prevTime.setMinutes(prevTime.getMinutes() - interval);

				var bias = data[currTime].forecast - data[prevTime].price;
				bias > 0 ? ++total : 0;
				++size;
				data[prop].accuracy = parseFloat((total/size).toFixed(2));
			}
		},
		SerialChart: function(id){
			//init
			var randNum = new Date().getTime()%1000;
			var chartID = 'chart' + randNum;

			$('#' + id).append('<div id="'+chartID+'"></div>');
			$('#'+chartID).attr('style',"width: 100%; height:400px;");


			// generate random


		    var chart = new AmCharts.AmSerialChart();
		    this.instance = chart;

		    // init
		    chart.hideCredits = true;
		    chart.categoryField = "time";
		    chart.categoryAxis.minPeriod = "mm";
		    chart.categoryAxis.parseDates = true;

		    // add component
		    chart.addValueAxis(new CHART.ValueAxis("v1", "Price", "left"));
		    chart.addValueAxis(new CHART.ValueAxis("v2", "準確率", "right"));
    		chart.valueAxes[1].labelFunction = function(data){return (data * 100).toFixed(2) + "%";};

		    chart.addGraph(new CHART.Graph({
		    	id:"g1",
		    	title: "價錢線",
		    	valueField: "price",
		    	valueAxis: "v1",
		    	enableBalloon: true,
		    	color: "#f99f9f"
		    }));
		    chart.addGraph(new CHART.Graph({
		    	id:"g2",
		    	title: "預測線",
		    	valueField: "forecast",
		    	valueAxis: "v1",
		    	enableBalloon: false,
		    	color: "#fccc2d"
		    }));
		    chart.addGraph(new CHART.Graph({
		    	id:"g3",
		    	title: "準確率",
		    	valueField: "accuracy",
		    	valueAxis: "v2",
		    	enableBalloon: true,
		    	color: "#2dbefc"
		    }));

		    chart.addChartScrollbar(new CHART.ChartScrollbar("g1"));
		    chart.addChartCursor(new CHART.ChartCursor());

		    chart.write(chartID);

		    // functions
		    this.json = {};
		    this.validateData = ()=>chart.validateData();
		    this.addGraph = (g)=>chart.addGraph(g);
		    this.addValueAxis = (v)=>chart.addValueAxis(v);
		    this.addLegend = (l,divId)=>{
		    	if(divId){
					$('#' + divId).attr('style',
								 "height: 100px !important;"
								+"overflow: auto;"
								+"position: relative;"
								+"margin: 5px 0 20px 0;");
				}
		    	chart.addLegend(l,divId);
		    };

		    this.setJSON = function(JSONData){
		    	this.json = JSONData;
		    	chart.dataProvider = CHART.JsonToArray(JSONData);
		    	chart.validateData();
		    };
		    this.addJSON = function(JSONData){
				for(var prop in JSONData){
					for(var inner in JSONData[prop]){
						this.json[prop] = this.json[prop] || {};
						this.json[prop][inner] = JSONData[prop][inner];
					}
				}
		    	chart.dataProvider = CHART.JsonToArray(this.json);
		    	chart.validateData();
		    };
		    this.zoomByDates = (start, end)=>chart.zoomToDates(start, end);
		    this.zoomByIndex = (start, end)=>chart.zoomToIndexes(start, end);

		},
		Graph: function(config){
			config = config || {};
			config.color = config.color || "#" + (Math.random()*10).toFixed(0)
								+ (Math.random()*10000).toFixed(0)
								+ (Math.random()*10).toFixed(0);
		    var graph = new AmCharts.AmGraph();
		    graph.id = config.id;
		    graph.title = config.title;
		    graph.valueField = config.valueField;
		    graph.type = "smoothedLine";
		    graph.fillAlphas = 0;
		    graph.valueAxis = config.valueAxis;
		    graph.lineColor = config.color;
			graph.lineThickness = 2;

		    // bullet
			graph.bullet = "round";
			graph.bulletBorderAlpha = 1;
			graph.bulletSize = 2;
			graph.useLineColorForBulletColor = true;
			graph.useLineColorForBulletBorder = true;

			// balloon
			var balloon = new AmCharts.AmBalloon();
			graph.balloon = balloon;
			if(config.enableBalloon){
				graph.balloon.useGraphSettings = true;
		        graph.balloon.borderThickness = 0.2;
		        graph.balloon.shadowAlpha = 0;
		        graph.balloon.fillColor = config.color;
		        graph.balloon.color = "#ffffff";
			}
			else{
				graph.balloon.enabled = false;
			}
			return graph;
		},
		ChartScrollbar: function(graph){
			var chartScrollbar = new AmCharts.ChartScrollbar();
			chartScrollbar.graph = graph;
			// Grid
			chartScrollbar.autoGridCount = true;
			chartScrollbar.color = "#666666"
			// not selected
			chartScrollbar.backgroundAlpha = 0;
			chartScrollbar.graphFillAlpha = 0;
			chartScrollbar.graphLineAlpha = 0.2;
			// selected
			chartScrollbar.selectedBackgroundAlpha = 0.1;
			chartScrollbar.selectedBackgroundColor = "#000000";
			chartScrollbar.selectedGraphFillAlpha = 0;
			chartScrollbar.selectedGraphLineAlpha = 0.5;


			return chartScrollbar;
		},
		ValueAxis: function(id, title, position){
			var valueAxis = new AmCharts.ValueAxis();
			valueAxis.id = id;
			valueAxis.title = title;
			valueAxis.position = position;
			valueAxis.axisAlpha = 1;
			valueAxis.gridAlpha = 0;
			return valueAxis;
		},
		ChartCursor: function(){
			var chartCursor = new AmCharts.ChartCursor();
		    chartCursor.categoryBalloonDateFormat = "JJ:NN, MMMM DD";
		    chartCursor.cursorPosition = "mouse";
		    chartCursor.cursorAlpha = 0.2;
		    chartCursor.valueLineEnabled = true;
		    chartCursor.valueLineBalloonEnabled = true;
		    chartCursor.valueLineAlpha = 0.3;
		    // chartCursor.limitToGraph = "priceGraph";
		    return chartCursor
		},
		Legend: function() {
			var legend = new AmCharts.AmLegend();
		    legend.useGraphSettings = true;
		    legend.horizontalGap = 10;
		    legend.maxColumns = 1;
		    legend.labelText = "[[title]]";

			return legend;
		},
		Searcher: function(divId){
			var scope = this;
			this.$ = {};
			var input = this.$.input = $('<input type="search" placeholder="股票代碼">');
			var button = this.$.button = $('<input type="button">');
			$('#'+divId).append(input);
			$('#'+divId).append(button);
			button.attr('style', 'left: -25px;'
								+'top: 5px;'
								+'background: url("/images/search.png") no-repeat center;');

			// event
			input.on('keydown',(event)=>{ if(event.keyCode == 13)scope.searchFunction(event); });
			button.on('mouseup',(event)=>scope.searchFunction(event));

			// Functions
			this.searchFunction = function(){
				// define search function
				console.log(input.val());
				console.log(new Date().toISOString().split("T")[0]);
			};
			this.val = function(value){
				if(value === undefined)
					return input.val();
				else
					return val(value);
			}

		},
		SearcherWithDate: function(divId){
			var scope = this;
			this.$ = {};
			var searcher = this.searcher = new CHART.Searcher(divId);
			this.$.input = searcher.$.input;
			this.$.button = searcher.$.button;
			var date = this.$.date = $('<input type="date">');
			date.val(new Date().toISOString().split("T")[0]);
			$('#'+divId).append(date);

			date.on('keydown',(event)=>{ if(event.keyCode == 13)searcher.searchFunction(); });

			// function override
			searcher.searchFunction = function(){
				console.log(searcher.val());
				console.log(date.val());
			}

		},
		Tracker: function(divId, chart){
			var scope = this;
			this.$ = {};
			var checkbox = this.$.checkbox = $('<input type="checkbox" checked>');
			var input = this.$.input = $('<input type="number" value="10">');
			$('#'+divId).append(checkbox);
			$('#'+divId).append('追蹤最近');
			$('#'+divId).append(input);
			$('#'+divId).append('min');

			input.on({
				focusout: (event)=>scope.trackFunction(event),
				keydown: (event)=>{
					if(event.keyCode == 13)
						scope.trackFunction(event);
				}
			});
			checkbox.on('change', function(event){
				if(this.checked)
					scope.trackFunction(event);
			});

			// track Function
			this.trackFunction	 = function (){
				if(checkbox.prop("checked")){
					// zoom Chart
					var chartData = chart.instance.dataProvider;
					var end = new Date(chartData[chartData.length - 1].time);
					var start = new Date(end);
					start.setMinutes(end.getMinutes() - input.val() - 1);
					end.setMinutes(end.getMinutes() + 1);
					chart.zoomByDates(start, end);
				}
			}
			this.trackFunction();
		}


	};

	return CHART;
}));

