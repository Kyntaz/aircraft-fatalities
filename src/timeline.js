var timeLine;
var x_Origem = 1970;
var x_Destino = 2017;

var TimeLine = function(data, keys) {

    var options = {
        margin: { top: 20, right: 30, bottom: 20, left: 30 },
        minYear: 1970,
        maxYear: 2017,
    },
    width = $('#timeline').width() - options.margin.left - options.margin.right,
    height = $('#timeline').height() - options.margin.top - options.margin.bottom;


    y = d3.scaleLinear()
        .range([height, 0]),

    x = d3.scaleLinear()
        .range([0, width]),

    xAxis = d3.axisBottom(x).tickFormat(d3.format("d")),
    yAxis = d3.axisLeft(y).ticks(5),

    generateLine = d3.line()
                    .x(function(d){return x(d.year);})
                    .y(function(d){return y(d.count);})
        
    svg = d3.select('#timeline').append('svg')
            .attr('height', height + options.margin.top + options.margin.bottom)
            .attr('width', width + options.margin.left + options.margin.right)
        .append('g')
            .attr('transform', 'translate(' + options.margin.left + "," + options.margin.top + ')');


    var brushed = function() {
		var extent = d3.event.selection.map(x.invert, x);
		x_Origem = extent[0].toFixed(0);
        x_Destino = extent[1].toFixed(0);
        $(document).trigger('yearsChanged', [{begin: x_Origem, end: x_Destino}]);
    };
    
    this.updateData = function(data, keys, colors) {
        const filteredData = data.filter(function(d) {
            return keys.includes(d.key);
          });
      
        const dataset = keys.map(function(key, i) {
            return {
                name: key,
                color: colors[i] || "#ffab00",
                values: filteredData.filter(function(d) {
                return d.key === key;
                }).map(function(d) {
                if (d.key === key) {
                    return {
                    year: +d.year,
                    count: +d.count
                    }
                }
                })
            }
        });

        const yMin = 0;
        const yMax = d3.max(filteredData, function(d) {
            return +d.count;
        });

        y.domain([yMin, yMax * 1.1]);

        svg.select('.y.axis')
            .transition()
            .duration(1000)
            .call(yAxis);

        const filterLine = svg.selectAll(`.line-g`)
            .data(dataset, function(d) {
              return d.name;
            });
      
        // remove data differences
        filterLine.exit()
            .transition()
            .duration(1000)
            .style("opacity", "0")
            .style("stroke-width", "0")
            .remove();
        
        // append new
        filterLine.enter().append("g")
            .attr("class", `line-g`)
            .append("path")
            .attr("class", "line")
            .style("opacity", "0")
            .style("stroke-width", "0");
    
        svg.selectAll(`.line`)
            .transition()
            .duration(1000)
            .style("stroke", function(d) {
                return d.color;
            })
            .attr("d", function(d) {
                return generateLine(d.values);
            })
            .style("opacity", "1")
            .style("stroke-width", "3px");
    }


    this.init = function() {

        const filteredData = data.filter(function(d) {
            return keys.includes(d.key);
          });
      
        const dataset = keys.map(function(key) {
        return {
            name: key,
            color: "#ffab00",
            values: filteredData.filter(function(d) {
            return d.key === key;
            }).map(function(d) {
            if (d.key === key) {
                return {
                year: +d.year,
                count: +d.count
                }
            }
            })
        }
        });

        var bisectDate = d3.bisector(function(d) { return d.year; }).left,
            formatCurrency = function(d) { return d };

        var maxCount = d3.max(filteredData, function(d){return +d.count;}) * 1.1;

        y.domain([0, maxCount]);
        x.domain([options.minYear, options.maxYear]);

        const line = svg.selectAll(`.line-g`)
            .data(dataset, function(d) {
                return d.name;
            })
            .enter().append("g")
            .attr("class", "line-g");
              
        line.append("path")
            .attr("class", "line")
            .style("stroke", function(d) {
                return d.color;
            })
            .attr("d", function(d) {
                return generateLine(d.values);
            });

        svg.append('g').attr('class', 'x axis').attr('transform', 'translate(0, '+height+')').call(xAxis);
        svg.append('g').attr('class', 'y axis').call(yAxis);

        svg.select('.y.axis')
            .append('text')
                //.attr("transform", "rotate(-90)")
                .attr("y", 0)
                .attr("x", "200px")
                .attr("dy", "-5px")
                .style("text-anchor", "end")
                .attr("font-size", "14px")
                .text("Number of Aircraft Occurrences");

        var brush = d3.brushX(x)
                    .extent([[0, 0], [width, height]])
                    .on("end", brushed)

        svg.append("g")
                .attr("class", "brush")
                .call(brush)
                .call(brush.move, [1970, 2017].map(x))
    };

}

