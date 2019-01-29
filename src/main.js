function destroyTagator() {
  $('#filter-input').tagator('destroy');
}

function clearAllTagator() {
  $('#filter-input').tagator('clearAll');
}

function createTagator(data) {
  $('#filter-input').tagator({
    autocomplete: data
  });
}

function replaceTagator(data) {
  clearAllTagator();
  $('#filter-input').tagator('autocomplete', data);
}

var currentFilter = 'Countries';

d3.csv('data/country_stats.csv').then(function(data) {
  countriesData = data;
  lineChartData = data;
  lineChart = new LineChart(data, ['Worldwide']);
  lineChart.init();

  timeLine = new TimeLine(data, ['Worldwide']);
  timeLine.init();
}); 

$(document).ready(function() {

  var filters = {};

  d3.csv('data/countries.csv').then(function(data) {
    filters['Countries'] = data;
    createTagator(data);
  });

  d3.csv('data/causes.csv').then(function(data) {
    filters['Causes'] = data;
  });

  d3.csv('data/natures.csv').then(function(data) {
    filters['Natures'] = data;
  });


  $('.filter-button').on('click', function() {
    $('.filter-button').removeClass('selected');
    $(this).addClass('selected');
    const filter = this.textContent;
    currentFilter = filter;

    sankeyData = countrySankeyData;
    updateNodes(['Worldwide'], []);

    if (currentFilter === 'Causes') {
      lineChartData = causesData;
      sankeyData = causeSankeyData;
    } else if (currentFilter === 'Countries') {
      lineChartData = countriesData;
      sankeyData = countrySankeyData;
      lineChart.hideButtons(false);
    } else if (currentFilter === 'Natures') {
      lineChartData = naturesData;
      sankeyData = natureSankeyData;
    }
    lineChart.updateData(countriesData, ['Worldwide'], []);
    timeLine.updateData(countriesData, ['Worldwide'], []);
    updateGlobeData(['Worldwide'], []);
    
    replaceTagator(filters[filter]);
  });

  $(document).on('clearAll', function(e, args) {
    lineChart.updateData(countriesData, ['Worldwide'], []);
    timeLine.updateData(countriesData, ['Worldwide'], []);
    const temp = sankeyData;
    sankeyData = countrySankeyData;
    updateNodes(['Worldwide'], []);
    sankeyData = temp;
    updateGlobeData(['Worldwide'], []);
  });

  $('.clear-filters').on('click', function() {
    clearAllTagator();
    lineChart.updateData(countriesData, ['Worldwide'], []);
    timeLine.updateData(countriesData, ['Worldwide'], []);
    const temp = sankeyData;
    sankeyData = countrySankeyData;
    updateNodes(['Worldwide'], []);
    sankeyData = temp;
    updateGlobeData(['Worldwide'], []);
  });
  
  $(document).on('filterSelected', function(e, args) {
    if (currentFilter === 'Causes') {
      lineChart.hideButtons(true);
    } else if (currentFilter === 'Countries') {
      lineChart.hideButtons(false);
      //lineChart.updateData(lineChartData, ['Worldwide'], args.colors);
    } else if (currentFilter === 'Natures') {
      lineChart.hideButtons(true);
    }
    
    lineChart.updateData(lineChartData, args.filters, args.colors);
    timeLine.updateData(lineChartData, args.filters, args.colors)
    updateGlobeData(args.filters, args.colors);
    updateNodes(args.filters, args.colors);
  });

  $(document).on('yearsChanged', function(e, args) {
    lineChart.updateCurrentData(args.begin, args.end);
    updateWordCloud(args.begin, args.end);
    drawMarkers();
    updateLinks();
  });

  $(document).on('lineChartYearChanged', function(e, args) {
    highlightGlobeYear(args);
  })
});