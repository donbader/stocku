var margin = {top: 20, right: 20, bottom: 40, left: 40},
    width = 700 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatPercent = d3.format(".0%");

var x = d3.scale.ordinal().rangeRoundBands([0, width], .1, 1);

var y = d3.scale.linear().range([height, 0]);

var xAxis = d3.svg.axis().scale(x).orient("bottom");

var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(formatPercent);

var svg = d3.select("body").select("div#rank").append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var maketsv = function(error, data) {
  
  data.forEach(function(d) {
    d.accuracy = +d.accuracy;
  });

  x.domain(data.map(function(d) { return d.stock; }));
  y.domain([0, d3.max(data, function(d) { return d.accuracy; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
    .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "5em")
      .style("text-anchor", "end")
      .text("Accuracy");

  svg.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x(d.stock); })
      .attr("width", x.rangeBand())
      .attr("y", function(d) { return y(d.accuracy); })
      .attr("height", function(d) { return height - y(d.accuracy); });

  svg.select(".x.axis")
  .selectAll("text")
  .attr("transform"," translate(-3,20) rotate(-45)") // To rotate the texts on x axis. Translate y position a little bit to prevent overlapping on axis line.
  .style("font-size","1px");

  d3.select("input").on("change", change);

  var sortTimeout = setTimeout(function() {
    d3.select("input").property("checked", true).each(change);
  }, 10);

  function change() {
    clearTimeout(sortTimeout);

    // Copy-on-write since tweens are evaluated after a delay.
    var x0 = x.domain(data.sort(this.checked
        ? function(a, b) { return b.accuracy - a.accuracy; }
        : function(a, b) { return d3.ascending(a.stock, b.stock); })
        .map(function(d) { return d.stock; }))
        .copy();

    svg.selectAll(".bar")
        .sort(function(a, b) { return x0(a.stock) - x0(b.stock); });

    var transition = svg.transition().duration(750),
        delay = function(d, i) { return i * 50; };

    transition.selectAll(".bar")
        .delay(delay)
        .attr("x", function(d) { return x0(d.stock); });

    transition.select(".x.axis")
        .call(xAxis)
      .selectAll("g")
        .delay(delay);
  }
}

/* init */
var sel_date = $('#sel_date');
var img_dist = $('#distribution');
sel_date.change(function(){
	d3.select("body").select("div#rank").select("svg").remove()
	
	svg = d3.select("body").select("div#rank").append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	var accur_data = "accur/" + sel_date.val().split('-')[0] + sel_date.val().split('-')[1] + sel_date.val().split('-')[2] + "_accur_data.tsv";
	console.log(accur_data);
	d3.tsv(accur_data,maketsv);
  img_dist.attr("src","images/dist/" + sel_date.val().split('-')[0] + sel_date.val().split('-')[1] + sel_date.val().split('-')[2] + "_dist.png");
});

$("img#distribution").on("error", function(){
        $(this).attr('src', 'images/market_closed.jpeg');
});

sel_date.val("2016-12-20");
img_dist.attr("src","images/dist/20161220_dist.png");
d3.tsv("accur/20161220_accur_data.tsv",maketsv);