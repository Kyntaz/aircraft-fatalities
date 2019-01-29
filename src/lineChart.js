var lineChart;
var lineChartData;
var countriesData;
var causesData;
var naturesData;
// d3.csv('data/country_stats.csv').then(function(data) {
//   countriesData = data;
//   lineChartData = data;
//   lineChart = new LineChart(data, ['Worldwide']);
//   lineChart.init();
// }); 

d3.csv('data/causes_stats.csv').then(function(data) {
  causesData = data;
}); 

d3.csv('data/nature_stats.csv').then(function(data) {
  naturesData = data;
}); 

var LineChart = function(data, keys) {

  var options = {
    measureButtons: ['Fatalities', 'Carried', 'F/C %'],
    measureButtons2: ['Fatalities'],
    measuresKeys: ['fatalities', 'carried', 'fatality_percentage'],
    xKey: 'year',
    yLeftKey: 'fatality_percentage',
    margins: {
      top: 30,
      right: 50,
      bottom: 40,
      left: 90,
    },
    legend: {
      squareSize: 10,
      topSpacingSquare: 40,
      topSpacingText: 50.5,
      fontSize: "12",
    },
    filterButtons: {
      width: 100,
      height: 40,
      fontSize: "14",
      spacing: 10,
      x0: 20,
      background: '#f5f6f7'
    },
    lineClass: 'linechart-line',
  },

    selector = '#line-chart',

    width = $(selector).width() - options.margins.left - options.margins.right,
    height = $(selector).height() - options.margins.top - options.margins.bottom,

    svg = d3.select(selector).append("svg")
        .attr("width", width + options.margins.left + options.margins.right)
        .attr("height", height + options.margins.top + options.margins.bottom)
        .append("g")
        .attr("transform", "translate(" + options.margins.left + "," + options.margins.top + ")"),
        
    currYLeftKey = options.yLeftKey,
    currentData = data,
    currentKeys = ['Worldwide'],
    currentColors = [];

  var generateLine = d3.line()
      .x(function(d) { return xScale(+d[options.xKey]); })
      .y(function(d) { return yLeftScale(+d[currYLeftKey]); }) 
    .curve(d3.curveMonotoneX),

    updateLine = function(dataset) {
      const filterLine = svg.selectAll(`.${options.lineClass}-filter`)
      .data(dataset, function(d) {
        return d.id;
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
          .attr("class", `${options.lineClass}-filter`)
          .append("path")
          .attr("class", options.lineClass)
          .style("opacity", "0")
          .style("stroke-width", "0");

      svg.selectAll(`${selector} .${options.lineClass}`)
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
    },

    updateMouseLines = function(dataset) {
      const mouseG = svg.select('.mouse-over-effects');

      const mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(dataset, function(d) {
          return d.name;
        });

      mousePerLine.exit()
          .transition()
          .duration(1000)
          .style("opacity", "0")
          .style("stroke-width", "0")
          .remove();

      mousePerLine.enter()
          .append("g")
          .attr("class", "mouse-per-line");

      svg.select('.mouse-line')
          .remove();

      svg.select('.mouse-line-container').append("path")
          .attr("class", "mouse-line")
          .style("stroke-dasharray", ("5,2"))
          .style("stroke", "#838383")
          .style("stroke-width", "1px")
          .style("opacity", "0");
    
      svg.selectAll('.mouse-per-line').append("circle")
          .attr("r", 5)
          .style("stroke", function(d) {
            return d.color;
          })
          .style("fill", "none")
          .style("stroke-width", "2px")
          .style("opacity", "0");
    
      svg.selectAll('.mouse-per-line').append("text")
          .attr("transform", "translate(10,3)");
    
      mouseG.append("svg:rect")
          .attr("width", width)
          .attr("height", height)
          .attr("fill", 'none')
          .attr('pointer-events', 'all')
          .on('mouseout', function() {
            d3.select('.mouse-line')
              .style("opacity", "0");
            d3.select('.mouse-line-container')
              .style("opacity", "0");
            d3.selectAll('.mouse-per-line circle')
              .style("opacity", "0");
            d3.selectAll('.mouse-per-line text')
              .style("opacity", "0");

            svg.selectAll('.legend text')
                .text(function(d) {
                  return d.name;
                })

            $(document).trigger('lineChartYearChanged', undefined);
          })
          .on('mouseover', function() {
            d3.select('.mouse-line')
              .style("opacity", "1");
            d3.select('.mouse-line-container')
              .style("opacity", "1");
            d3.selectAll('.mouse-per-line circle')
              .style("opacity", "1");
            d3.selectAll('.mouse-per-line text')
              .style("opacity", "1");
          })
          .on('mousemove', function() {
            var mouse = d3.mouse(this);
            var currentD;
            d3.selectAll(".mouse-per-line")
              .attr("transform", function(d, i) {
                const values = d.values;
                var xYear = xScale.invert(mouse[0]),
                    bisect = d3.bisector(function(d) { return d.year; }).left;
                    idx = bisect(d.values, xYear),
                    d0 = values[idx - 1 >= 0 ? idx - 1 : 0],
                    d1 = values[idx],
                    currentD = xYear - d0.year > d1.year - xYear ? d1 : d0;

                var lineFilter = d.name;
                var currLegend = $(`.legend text:contains(${d.name})`)[0];

                let value = currentD[currYLeftKey];
                if (currYLeftKey == 'fatalities') {

                } else if (currYLeftKey == 'carried') {
                  if (value / 10e6 >= 1) {
                    value = (Math.round(value / 10e6)) + " M";
                  } else if (value != 0) {
                    value = (Math.round(value / 10e3)) + " K";
                  }
                  
                } else if (currYLeftKey == 'fatality_percentage') {
                  value = (value * 10000).toFixed(2) + "ppm";
                }

                d3.select(currLegend)
                  .text(function() {
                    return `${lineFilter}: ${value}`;
                  });
                
                d3.select('.mouse-line-container')
                  .select('text')
                    .attr('y', mouse[1] - 5)
                    .attr('x', xScale(currentD.year) + 5)
                    .text(currentD[options.xKey]);

                $(document).trigger('lineChartYearChanged', currentD.year);
                  
                return "translate(" + xScale(currentD.year) + "," + yLeftScale(currentD[currYLeftKey]) +")";
              });
    
            
            svg.select(".mouse-line")
              .attr("d", function() {
                var d = "M" + xScale(currentD.year) + "," + height;
                d += " " + xScale(currentD.year) + "," + 0;
                return d;
              });
          });
    }
    
    xScale = d3.scaleLinear()
      .range([0, width]),

    yLeftScale = d3.scaleLinear()
        .range([height, 0]);
    
    var xAxis = d3.axisBottom(xScale)
        .ticks(10, "d");
    var yLeftAxis = d3.axisLeft(yLeftScale).ticks(8).tickFormat(function(d) {
      return d + " %";
    });; 

  this.init = function() {

    const filteredData = data.filter(function(d) {
      return keys.includes(d.key);
    });

    const dataset = keys.map(function(key) {
      return {
        id: key + currYLeftKey + x_Origem + x_Destino,
        name: key,
        color: "#ffab00",
        values: filteredData.filter(function(d) {
          return d.key === key;
        }).map(function(d) {
          if (d.key === key) {
            return {
              [options.xKey]: +d[options.xKey],
              [currYLeftKey]: +d[currYLeftKey]
            }
          }
        })
      }
    });

    const xMin = filteredData[0].year;
    const xMax = filteredData[filteredData.length - 1].year;

    const yLeftMin = 0;
    const yLeftMax = d3.max(filteredData, function(d) {
      return +d[currYLeftKey];
    });
    

    xScale.domain([xMin, xMax]);
    yLeftScale.domain([yLeftMin, yLeftMax * 1.2]);

    const buttonWidth = options.filterButtons.width;
    const buttonHeight = options.filterButtons.height;
    const buttonFontSize = options.filterButtons.fontSize;
    const buttonSpacing = options.filterButtons.spacing;
    const buttonsX0 = options.filterButtons.x0;

    var dynamicsContainer = svg.append("g")
        .attr("class", "dynamics-container");

    var container = svg.append("g")
        .attr("class", "statics-container");
  
    container.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);
  
    container.append("g")
        .attr("class", "y axis")
        .call(yLeftAxis);

    svg.select('.x.axis')
        .append('text')
          //.attr("transform", "rotate(-90)")
          .attr("x", width)
          .attr("y", "35px")
          .style("text-anchor", "end")
          .attr("font-size", "14px")
          .text("Years");

    const filterLine = dynamicsContainer.selectAll(`.${options.lineClass}-filter`)
        .data(dataset, function(d) {
          return d.id;
        })
        .enter().append("g")
        .attr("class", `${options.lineClass}-filter`);
  
    filterLine.append("path")
        .attr("class", options.lineClass)
        .style("stroke", function(d) {
          return d.color;
        })
        .attr("d", function(d) {
          return generateLine(d.values)
        });
  
    const mouseG = dynamicsContainer.append("g")
        .attr("class", "mouse-over-effects");

    const mouseLineContainer = dynamicsContainer.append('g')
        .attr('class', 'mouse-line-container');

    mouseLineContainer.append('text')
  
    mouseLineContainer.append("path")
        .attr("class", "mouse-line")
        .style("stroke-dasharray", ("5,2"))
        .style("stroke", "#838383")
        .style("stroke-width", "1px")
        .style("opacity", "0");
  
    var mousePerLine = mouseG.selectAll('.mouse-per-line')
        .data(dataset, function(d) {
          return d.name;
        })
        .enter()
        .append("g")
        .attr("class", "mouse-per-line");
  
    mousePerLine.append("circle")
        .attr("r", 5)
        .style("stroke", function(d) {
          return d.color;
        })
        .style("fill", "none")
        .style("stroke-width", "2px")
        .style("opacity", "0");
  
    mousePerLine.append("text")
        .attr("transform", "translate(10,3)");
  
    mouseG.append("svg:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', function() {
          d3.select('.mouse-line-container')
            .style("opacity", "0");
          d3.selectAll('.mouse-per-line circle')
            .style("opacity", "0");
          d3.selectAll('.mouse-per-line text')
            .style("opacity", "0");
        })
        .on('mouseover', function() {
          d3.select('.mouse-line-container')
            .style("opacity", "1");
          d3.selectAll('.mouse-per-line circle')
            .style("opacity", "1");
          d3.selectAll('.mouse-per-line text')
            .style("opacity", "1");
        })
        .on('mousemove', function() {
          var mouse = d3.mouse(this);
          var currentD;
          d3.selectAll(".mouse-per-line")
            .attr("transform", function(d, i) {
              const values = d.values;
              var xYear = xScale.invert(mouse[0]),
                  bisect = d3.bisector(function(d) { return d.year; }).left;
                  idx = bisect(d.values, xYear),
                  d0 = values[idx],
                  d1 = values[idx],
                  currentD = xYear - d0.year > d1.year - xYear ? d1 : d0;

              var lineFilter = d.name;
              var currLegend = $(`.legend text:contains(${d.name})`)[0];

              d3.select(currLegend)
                .text(function() {
                  return `${lineFilter}: ${currentD[currYLeftKey]}`;
                });

              d3.select(this).select('text')
                .text(currentD[options.xKey]);


              return "translate(" + xScale(currentD.year) + "," + yLeftScale(currentD[currYLeftKey]) +")";
            });
  
          svg.select(".mouse-line")
            .attr("d", function() {
              var d = "M" + xScale(currentD.year) + "," + height;
              d += " " + xScale(currentD.year) + "," + 0;
              return d;
            });
        });

    const legend = container.selectAll('.legend')
        .data(dataset, function(d) {
          return d.name;
        })
        .enter()
        .append("g")
        .attr("class", "legend");
    
    legend.append('rect')
        .attr('x', width - (width / 5) - 16)
        .attr('y', function(d, i) {
          return i * 20 + options.legend.topSpacingSquare;
        })
        .attr('width', 12)
        .attr('height', 12)
        .style('fill', function(d) {
          return d.color;
        });
  
    legend.append('text')
        .attr('x', width - (width / 5))
        .attr('y', function(d, i) {
          return i * 20 + options.legend.topSpacingText;
        })
        .style("font-size", options.legend.fontSize)
        .text(function(d) {
          return d.name;
        });

    self = this;

    const buttons = container.selectAll('.measure-button')
        .data(options.measureButtons)
        .enter()
        .append('g')
          .attr('class', function(d) {            
            return d !== 'F/C %' ? 'measure-button' : 'measure-button selected'
          })
          .style('cursor', 'pointer')
          .on('mouseover', function(d) {
            d3.select(this)
              .classed('active', true);
          })
          .on('mouseout', function(d) {
            d3.select(this)
              .classed('active', false);
          })
          .on('click', function(d, i) {
            $('.measure-button').removeClass('selected');
            $(this).addClass('selected')
            currYLeftKey = options.measuresKeys[i];
            self.updateData(currentData, currentKeys, currentColors);
          });

    buttons.append('rect')
            .attr('width', function(d) {
              return buttonWidth;
            })
            .attr('height', buttonHeight)
            .attr('fill', options.filterButtons.background)
            .attr('x', function(d, i) {
              return buttonsX0 + width - (width - i * (buttonWidth + buttonSpacing));
            })
            .attr('y', function(d) {
              return 0;
            });
    
    buttons.append('text')
            .style('font-size', buttonFontSize)
            .attr("text-anchor","middle")
            .attr("dominant-baseline","central")
            .text(function(d) {
              return d;
            })
            .attr('x', function(d, i) {
              return buttonsX0 + width - (width - buttonWidth / 2 - i * (buttonWidth + buttonSpacing));
            })
            .attr('y', function(d) {
              return buttonHeight / 2;
            });

  }

  this.hideButtons = function(hide) {
    let buttons;
    const container = svg.select(".statics-container");

    if (hide) {
      buttons = container.selectAll('.measure-button')
        .data(options.measureButtons2);

      currYLeftKey = options.measuresKeys[0];
        self.updateData(currentData, currentKeys, currentColors);
    } else {
      buttons = container.selectAll('.measure-button')
        .data(options.measureButtons);

      const newButtons = buttons.enter()
        .append('g')
          .attr('class', 'measure-button')
          .style('cursor', 'pointer')
          .on('mouseover', function(d) {
            d3.select(this)
              .classed('active', true);
          })
          .on('mouseout', function(d) {
            d3.select(this)
              .classed('active', false);
          })
          .on('click', function(d, i) {
            $('.measure-button').removeClass('selected');
            $(this).addClass('selected')
            currYLeftKey = options.measuresKeys[i];
            self.updateData(currentData, currentKeys, currentColors);
          });

      const buttonWidth = options.filterButtons.width;
      const buttonHeight = options.filterButtons.height;
      const buttonFontSize = options.filterButtons.fontSize;
      const buttonSpacing = options.filterButtons.spacing;
      const buttonsX0 = options.filterButtons.x0;

      newButtons.append('rect')
          .attr('width', function(d) {
            return buttonWidth;
          })
          .attr('height', buttonHeight)
          .attr('fill', options.filterButtons.background)
          .attr('x', function(d, i) {
            return buttonsX0 + width - (width - i * (buttonWidth + buttonSpacing));
          })
          .attr('y', function(d) {
            return 0;
          });
  
      newButtons.append('text')
          .style('font-size', buttonFontSize)
          .attr("text-anchor","middle")
          .attr("dominant-baseline","central")
          .text(function(d) {
            return d;
          })
          .attr('x', function(d, i) {
            return buttonsX0 + width - (width - buttonWidth / 2 - i * (buttonWidth + buttonSpacing));
          })
          .attr('y', function(d) {
            return buttonHeight / 2;
          });
    }

    buttons.exit().remove();

    if (hide) {
      $('.measure-button').addClass('selected');
    }

    
  }

  this.updateCurrentData = function(begin, end) {
    this.updateData(currentData, currentKeys, currentColors, begin, end);
  }

  this.updateData = function(data, keys, colors) {

    const filteredData = data.filter(function(d) {
      return keys.includes(d.key) && d.year >= x_Origem && d.year <= x_Destino;
    });

    currentData = data;
    currentKeys = keys;
    currentColors = colors;

    const dataset = keys.map(function(key, i) {
      return {
        id: key + currYLeftKey + x_Origem + x_Destino,
        name: key,
        color: colors[i] || "#ffab00",
        values: filteredData.filter(function(d) {
          return d.key === key;
        }).map(function(d) {
          if (d.key === key) {
            return {
              [options.xKey]: +d[options.xKey],
              [currYLeftKey]: +d[currYLeftKey]
            }
          }
        })
      }
    });
    const xMin = filteredData[0].year;
    const xMax = filteredData[filteredData.length - 1].year;

    const yLeftMin = 0;
    const yLeftMax = d3.max(filteredData, function(d) {
      return +d[currYLeftKey];
    });

    const numberOfYears = xMax - xMin;

    if (numberOfYears < 10) {
      xAxis.ticks(numberOfYears, "d");
    } else {
      xAxis.ticks(10, "d");
    }

    if (currYLeftKey == 'fatalities') {
      yLeftAxis.tickFormat(function(d) {
        return d;
      });
    } else if (currYLeftKey == 'carried') {
      yLeftAxis.tickFormat(function(d) {
        if (d / 10e6 >= 1) {
          d = d / 10e6 + " M";
        } else if (d != 0) {
          d = d / 10e3 + " K";
        }
        return d;
      });
    } else if (currYLeftKey == 'fatality_percentage') {
      yLeftAxis.tickFormat(function(d) {
        return (d * 10000) + "ppm";
      });
    }

    xScale.domain([xMin, xMax]);
    yLeftScale.domain([yLeftMin, yLeftMax * 1.2]);

    svg.select(`${selector} .x.axis`)
        .transition()
        .duration(1000)
        .call(xAxis);

    svg.select(`${selector} .y.axis`)
        .transition()
        .duration(1000)
        .call(yLeftAxis);

    updateLine(dataset);

    updateMouseLines(dataset);

    const legend = svg.selectAll('.legend')
    .data(dataset, function(d) {
      return d.name;
    });

    legend.exit()
        .transition()
        .duration(500)
        .style("opacity", "0")
        .remove();

    const legendWrapper = legend.enter()
        .append("g")
        .attr("class", "legend")
        
    legendWrapper.append('rect')
        .attr("class", "legend-square")
        .style('fill', function(d) {
          return d.color;
        })
        .attr('width', 0)
        .attr('height', 0)
        .transition()
        .duration(500)
        .attr('width', 12)
        .attr('height', 12);

    legendWrapper.append('text')
        .attr("class", "legend-text")
        .text(function(d) {
          return d.name;
        })
        .style("font-size", "0")
        .transition()
        .duration(500)
        .style("font-size", options.legend.fontSize);

    svg.selectAll('.legend-square')
        .attr('x', width - (width / 5) - 16)
        .attr('y', function(d, i) {
          return i * 20 + options.legend.topSpacingSquare;
        });

    svg.selectAll('.legend-text')
        .attr('x', width - (width / 5))
        .attr('y', function(d, i) {
          return i * 20 + options.legend.topSpacingText;
        });
      }
}