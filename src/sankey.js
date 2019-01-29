let dataJson = {"nodes": [], "links": []};
var currentSankeyCountries = ['Worldwide'];
var currentSankeyColors = ["rgb(255, 171, 0)"];
var countrySankeyData;
var causeSankeyData;
var natureSankeyData;
var lastNumberOfNodes;

var sankeyData = [];
alasql(`SELECT * FROM CSV("data/countries_sankey.csv",{headers:true})`, [], function(data) {
  countrySankeyData = data;
  sankeyData = data;
  computeNodes(['Worldwide'], ["rgb(255, 171, 0)"], 1970, 2017);
  objSankey = sk.createSankey('#sankey', configSankey, dataJson);
});

alasql(`SELECT * FROM CSV("data/cause_sankey.csv",{headers:true})`, [], function(data) {
  causeSankeyData = data;
});

alasql(`SELECT * FROM CSV("data/nature_sankey.csv",{headers:true})`, [], function(data) {
  natureSankeyData = data;
});

function updateNodes(countries, colors) {
  currentSankeyCountries = countries;
  currentSankeyColors = colors;
  computeNodes(countries, colors, x_Origem, x_Destino);
  $('#sankey').html('');
  if (dataJson.links.length === 2) {
    
    if (dataJson.links[0].value === 0 && dataJson.links[1].value === 0) {
      $('#sankey').html('Not enough data to compute the sankey');
    } else {
      objSankey = sk.createSankey('#sankey', configSankey, dataJson);
    }
  } else {
    objSankey = sk.createSankey('#sankey', configSankey, dataJson);
    
  }
}

function updateLinks() {
  computeNodes(currentSankeyCountries, currentSankeyColors, x_Origem, x_Destino);
  if (dataJson.links.length === 2) {
    
    if (dataJson.links[0].value === 0 && dataJson.links[1].value === 0) {
      $('#sankey').html('Not enough data to compute the sankey');
    } else {
      if ($('#sankey svg').length !== 1) {
        $('#sankey').html('');
        objSankey = sk.createSankey('#sankey', configSankey, dataJson);
      } else {
        objSankey.updateData(dataJson);
      }
    }
  } else {
    objSankey.updateData(dataJson);
  }
}

function computeNodes(countries, colors, begin, end) {
  dataJson = {"nodes": [], "links": []};
  let countriesString = '';
  const colorsMap = {}
  countries.forEach((country, i) => {
    colorsMap[country] = colors[i]
    countriesString += `"${country}"`;
    if (i != countries.length - 1) {
      countriesString += ',';
    }
  })

  alasql(`SELECT key, SUM(deaths) as deaths, SUM(survivors) as survivors FROM ? WHERE key = ANY(ARRAY[${countriesString}]) AND year >= ${begin} AND year <= ${end} GROUP BY key`, [sankeyData], function(data) {

    data.forEach((obj, i) => {
      const country = obj.key;
      const deaths = obj.deaths;
      const survivors = obj.survivors;
      
      const deathsLink = {
        "source": i,
        "target": countries.length,
        "value": deaths
      };

      const survivorsLink = {
        "source": i,
        "target": countries.length + 1,
        "value": survivors
      }

      dataJson.nodes.push({id: country, name: country, color: colorsMap[country] || ["rgb(255, 171, 0)"]});
      dataJson.links.push(deathsLink);
      dataJson.links.push(survivorsLink);

    });

    dataJson.nodes.push({id: "Died", name: "Died", color: "#c50636"});
    dataJson.nodes.push({id:"Survived", name: "Survived", color: "#53ae4b"});

  });
}

var configSankey = {
  margin: { top: 10, left: 15, right: 15, bottom: 10 },
  nodes: {
    dynamicSizeFontNode: {
      enabled: true,
      minSize: 14,
      maxSize: 30
    },
    draggableX: true, // default [ false ]
    draggableY: true, // default [ true ]
    colors: d3.scaleOrdinal(d3.schemeSet3)
  },
  links: {
    formatValue: function(val) {
      return d3.format(",.0f")(val);
    }
  },
  tooltip: {
    infoDiv: true,
    labelSource: 'Input:',
    labelTarget: 'Output:'
  }
};

var objSankey;