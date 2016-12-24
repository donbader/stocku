(function(global, factory) {
	if (global.CHART === undefined) {
		global.CHART = factory();
		global.CHART.init();
	}
}(window, function() {
	'use strict';
	var CHART = {
		init : function(){
			Date.prototype.yyyymmdd = function (){
				var mm = this.getMonth() + 1; // getMonth() is zero-based
				var dd = this.getDate();
				var yyyy = this.getFullYear();
				return yyyy
						+ "-" + (mm < 10 ? '0'+mm : mm)
						+ "-" + (dd < 10 ? '0'+dd : dd)
			}
			Date.prototype.HHMMSS = function(){
				var HH = this.getHours();
				var MM = this.getMinutes();
				var SS = this.getSeconds();
				return (HH < 10 ? '0'+HH : HH)
						+ ":" + (MM < 10 ? '0'+MM : MM)
						+ ":" + (SS < 10 ? '0'+SS : SS)
			}
			Date.prototype.yyyymmddHHMMSS = function(){
				return this.yyyymmdd() + " " + this.HHMMSS();
			}
		},
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

			startString = start.yyyymmddHHMMSS();
			chartData[startString] = chartData[startString] || {};
			chartData[startString][elementName] = Math.random()*25+75;

			var currTime = new Date(start);
			var nextTime = new Date(start);
			var currTimeString;
			var nextTimeString;
			for(var i=0; nextTime < end; i+=interval){
				currTime.setMinutes(start.getMinutes() + i);
				nextTime.setMinutes(currTime.getMinutes() + interval);
				currTimeString = currTime.yyyymmddHHMMSS();
				nextTimeString = nextTime.yyyymmddHHMMSS();
				chartData[nextTimeString] = chartData[nextTimeString] || {};
				switch(elementName){
					case "price":
						chartData[nextTimeString][elementName] = this.randomDatum(chartData[currTimeString][elementName], bias);
						break;
					case "forecast":
						chartData[nextTimeString][elementName] = this.randomDatum(chartData[currTimeString]["price"], bias);
						break;
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
		calcAccuracy: function(data, interval){
			var interval = interval || 1;
			var total = 0;
			var size = 0;
			var json = {};
			for(var prop in data){
				if(data[prop].hit_acc !== undefined && data[prop].hit_acc_size !== undefined){
					continue;
				}
				if(data[prop].price === undefined || data[prop].forecast === undefined){
					json[prop] = {hit_acc: total, hit_acc_size: size};
					continue;
				}

				// iter
				var prevTime = new Date(prop);
				var currTime = new Date(prop);
				prevTime.setMinutes(prevTime.getMinutes() - interval);
				currTime = currTime.yyyymmddHHMMSS();
				prevTime = prevTime.yyyymmddHHMMSS();

				if(data[prevTime].hit_acc !== undefined && data[prevTime].hit_acc_size !== undefined){
					total = data[prevTime].hit_acc;
					size = data[prevTime].hit_acc_size;
				}

				var bias_forecast = data[currTime].forecast - data[prevTime].price;
				var bias_real = data[currTime].price - data[prevTime].price;
				bias_forecast*bias_real > 0 ? ++total : 0;
				++size;
				json[currTime] = json[currTime] || {};
				json[currTime].hit_acc = total;
				json[currTime].hit_acc_size = size;
				json[currTime].accuracy = parseFloat((total/size).toFixed(2));
			}
			return json;
		},
		SerialChart: function(id){
			// generate random id
			var randNum = new Date().getTime()%1000;
			var chartID = 'chart' + randNum;

			$('#' + id).append('<div id="'+chartID+'"></div>');
			$('#'+chartID).attr('style',"width: 100%; height:400px;");


		    var chart = new AmCharts.AmSerialChart();
		    this.instance = chart;

		    // init
		    var prevStartDate;
		    var prevEndDate;
		    chart.hideCredits = true;
		    chart.categoryField = "time";
		    chart.categoryAxis.minPeriod = "mm";
		    chart.categoryAxis.parseDates = true;


		    this.add = function(config){
		    	for(var component in config){
		    		switch(component){
		    			case "legend":
			    			var divId = config[component].divId;
					    	if(divId){
								$('#' + divId).attr('style',
											 "height: 100px !important;"
											+"overflow: auto;"
											+"position: relative;"
											+"margin: 5px 0 20px 0;");
						    	chart.addLegend(config[component], divId);
							}
		    			break;
		    			case "valueAxis":
		    				chart["valueAxes"].push(config[component]);
		    			break;
		    			case "graph":
		    				chart["graphs"].push(config[component]);
	    				break;
		    			default:
		    			chart[component] = config[component];
		    		}
		    	}
		    }

		    this.add(CHART.ValueAxis("v1", "Price", "left"));
		    this.add(CHART.ValueAxis("v2", "準確率", "right"));
    		chart.valueAxes[1].labelFunction = function(data){return (data * 100).toFixed(2) + "%";};
		    this.add(CHART.Graph({
		    	id:"g1",
		    	title: "價錢線",
		    	valueField: "price",
		    	valueAxis: "v1",
		    	enableBalloon: true,
		    	color: "#f99f9f"
		    }));
		    this.add(CHART.Graph({
		    	id:"g2",
		    	title: "預測線",
		    	valueField: "forecast",
		    	valueAxis: "v1",
		    	enableBalloon: false,
		    	color: "#fccc2d"
		    }));
		    this.add(CHART.Graph({
		    	id:"g3",
		    	title: "準確率",
		    	valueField: "accuracy",
		    	valueAxis: "v2",
		    	enableBalloon: true,
		    	color: "#2dbefc"
		    }));
		    this.add(CHART.ChartCursor());
		    this.add(CHART.ChartScrollbar("g1"));
		    this.add(CHART.PeriodSelector());
		    console.log(this.instance);


		    chart.write(chartID);

		    // functions
		    this.json = {};
		    this.jsonData = ()=>this.json;
		    this.arrayData = ()=>chart.dataProvider;
		    this.validateData = ()=>{
		    	oldDate = {startDate: chart.startDate, endDate: chart.endDate};
		    	chart.dataProvider = CHART.JsonToArray(this.json);
		    	chart.validateData();
		    };

		    this.setJSON = function(JSONData){
		    	this.json = JSONData;
		    };
		    this.addJSON = function(JSONData){
				for(var prop in JSONData){
					for(var inner in JSONData[prop]){
						this.json[prop] = this.json[prop] || {};
						this.json[prop][inner] = JSONData[prop][inner];
					}
				}
		    };
		    this.zoomByDates = (start, end)=>chart.zoomToDates(start, end);
		    this.zoomByIndex = (start, end)=>chart.zoomToIndexes(start, end);
		    var oldDate;
		    this.zoomByOldDates = ()=>chart.zoomToDates(oldDate.startDate, oldDate.endDate);


		},
		StockChart: function(id){
			// generate random id
			var randNum = new Date().getTime()%1000;
			var chartID = 'chart' + randNum;

			$('#' + id).append('<div id="'+chartID+'"></div>');
			$('#'+chartID).attr('style',"width: 100%; height:400px;");


		    var chart = new AmCharts.AmStockChart();
		    this.instance = chart;
		    // init
            var chartData= [
                {time: new Date(2011, 5, 1, 0, 0, 0, 0), open:10, high:20, low: 5, close: 13},
                {time: new Date(2011, 5, 2, 0, 0, 0, 0), open:13, high:14, low: 10, close: 10},
                {time: new Date(2011, 5, 3, 0, 0, 0, 0), open:10, high:16, low: 9, close: 15},
                {time: new Date(2011, 5, 4, 0, 0, 0, 0), open:15, high:20, low: 14, close: 20},
                {time: new Date(2011, 5, 5, 0, 0, 0, 0), open:20, high:26, low: 10, close: 25},
                {time: new Date(2011, 5, 6, 0, 0, 0, 0), open:25, high:30, low: 19, close: 20},
            ];

                var dataSet = new AmCharts.DataSet();
                dataSet.dataProvider = chartData;
                dataSet.fieldMappings = [
                	{fromField:"open", toField:"open"},
                	{fromField:"high", toField:"high"},
                	{fromField:"low", toField:"low"},
                	{fromField:"close", toField:"close"}
                ];
                dataSet.categoryField = "time";
                chart.dataSets = [dataSet];

                var stockPanel = new AmCharts.StockPanel();
				stockPanel.hideCredits = true;
                chart.panels = [stockPanel];

                var legend = new AmCharts.StockLegend();
                stockPanel.stockLegend = legend;

                var panelsSettings = new AmCharts.PanelsSettings();
                panelsSettings.startDuration = 0;
                chart.panelsSettings = panelsSettings;

                var graph = new AmCharts.StockGraph();
                graph.valueField = "value";
                graph.type = "candlestick";
                graph.title = "MyGraph";
		        graph.lineColor = "#00ff00";
                graph.fillAlphas = 0.4;
		        graph.fillColors = "#00ff00";
		        graph.openField = "open";
		        graph.closeField = "close";
		        graph.highField = "high";
		        graph.lowField = "low";
		        graph.negativeLineColor = "black";
		        graph.positiveLineColor = "black";
		        graph.negativeFillColors = "#db4c3c";
		        graph.comparedGraphLineThickness = 2;
		        graph.comparable = true;
		        graph.compareField = "close";
		        graph.proCandlesticks = true;

                stockPanel.addStockGraph(graph);

                var categoryAxesSettings = new AmCharts.CategoryAxesSettings();
                categoryAxesSettings.dashLength = 5;
                chart.categoryAxesSettings = categoryAxesSettings;

                var valueAxesSettings = new AmCharts.ValueAxesSettings();
                valueAxesSettings .dashLength = 5;
                chart.valueAxesSettings  = valueAxesSettings;

                var chartScrollbarSettings = new AmCharts.ChartScrollbarSettings();
                chartScrollbarSettings.graph = graph;
                chartScrollbarSettings.graphType = "line";
                chart.chartScrollbarSettings = chartScrollbarSettings;

                var chartCursorSettings = new AmCharts.ChartCursorSettings();
                chartCursorSettings.valueBalloonsEnabled = true;
                chart.chartCursorSettings = chartCursorSettings;

                var periodSelector = new AmCharts.PeriodSelector();
                periodSelector.position = "top";
                periodSelector.periods = [{period:"DD", count:1, label:"D"},
                                          {period:"MM", count:1, label:"M"},
                                          {period:"YYYY", count:1, label:"Y"},
                                          {period:"YTD", label:"YTD"},
                                          {period:"MAX", label:"MAX"}];
                chart.periodSelector = periodSelector;

                chart.write(chartID);


		},
		Graph: function(custom){
			var config = {
				graph:{
					id: custom.id,
					title: custom.title,
					valueField: custom.valueField,
					type: "smoothedLine",
					fillAlphas: 0,
					valueAxis: custom.valueAxis,
					lineColor: custom.color,
					lineThickness: 2,

					// bullet
					bullet: "round",
					bulletBorderAlpha: 1,
					bulletSize: 2,
					useLineColorForBulletColor: true,
					useLineColorForBulletBorder: true,
				}
			}

			config.graph.balloon = {};
			if(custom.enableBalloon){
				config.graph.balloon.useGraphSettings = true;
		        config.graph.balloon.borderThickness = 0.2;
		        config.graph.balloon.shadowAlpha = 0;
		        config.graph.balloon.fillColor = config.color;
		        config.graph.balloon.color = "#ffffff";
			}
			else{
				config.graph.balloon.enabled = false;
			}

			return config;
		},
		ChartScrollbar: function(graph){
			var config = {
				chartScrollbar:{
					graph: graph,
					// Grid
					autoGridCount: true,
					color: "#666666",
					// not selected
					backgroundAlpha: 0,
					graphFillAlpha: 0,
					graphLineAlpha: 0.2,
					// selected
					selectedBackgroundAlpha: 0.1,
					selectedBackgroundColor: "#000000",
					selectedGraphFillAlpha: 0,
					selectedGraphLineAlpha: 0.5
				}
			};

			return config;
		},
		ValueAxis: function(id, title, position){
			var config = {
				valueAxis: {
					id: id,
					title: title,
					position: position,
					axisAlpha: 1,
					gridAlpha: 0
				}
			}

			return config;
		},
		ChartCursor: function(){
			var config = {
				chartCursor:{
					categoryBalloonDateFormat: "JJ:NN, MMMM DD",
					cursorPosition: "mouse",
					cursorAlpha: 0.2,
					valueLineEnabled: true,
					valueLineBalloonEnabled: true,
					valueLineAlpha: 0.3
				}
			};
		    // chartCursor.limitToGraph = "priceGraph";
		    return config;
		},
		PeriodSelector: function(){
			var config = {
				periodSelector:{
					periods:[
						{period:"mm", count:1, label:"1 min"},
						{period:"hh", count:1, label:"1 hour"}
					]
				}
			}
			return config;
		},
		Legend: function(divId) {
			var config = {
				legend:{
					divId: divId,
		    		useGraphSettings: true,
		    		horizontalGap: 10,
		    		maxColumns: 1,
		    		labelText: "[[title]]"
	    		}
			}
			return config;
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
				focusout: (event)=>scope.track(event),
				keydown: (event)=>{
					if(event.keyCode == 13)
						scope.track(event);
				}
			});
			checkbox.on('change', function(event){
				if(this.checked)
					scope.track(event);
			});

			// zoom Function
			this.track = function (event){
				if(checkbox.prop("checked")){
					if(chart.instance.dataProvider === undefined) return;
					// zoom Chart
					var chartData = chart.instance.dataProvider;
					var end = new Date(chartData[chartData.length - 1].time);
					var start = new Date(end);
					start.setMinutes(end.getMinutes() - input.val() - 1);
					end.setMinutes(end.getMinutes() + 1);
					chart.zoomByDates(start, end);
				}
				else{
					chart.zoomByOldDates();
				}
			}
		}


	};

	return CHART;
}));
