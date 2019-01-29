var radius = 200;
var globe_data;

var globe_settings = {
  filters: [
    'worldwide'
  ],
  colors: [
    '#FFAB00'
  ]
};

var globe_winSize = [$("#globe").width() - 30, $("#globe").height() - 30];

var projection = d3.geoOrthographic()
    .scale(radius)
    .translate([globe_winSize[0] / 2, globe_winSize[1] / 2])
    .clipAngle(90);

var globe_svg = d3.select("#globe").append("svg")
    .attr("width", globe_winSize[0])
    .attr("height", globe_winSize[1])
    .on("mousedown", mousedown)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup)
    .on("wheel", wheelZoom);

var globe_defs = globe_svg.append('defs');

var info_text = null;

var globe_base = globe_svg.append("circle")
    .attr("cx", globe_winSize[0] / 2)
    .attr("cy", globe_winSize[1] / 2)
    .attr("r", radius)
    .style("fill", "#e5e5e5")
    .style("stroke", "#738689");
    
var path = d3.geoPath()
    .projection(projection);

d3.json("world-countries.json").then(function(collection) {
  globe_svg.selectAll("path")
      .data(collection.features)
      .enter().append("svg:path")
      .attr("d", path)
      .style("stroke", "#7c7c7c")
      .style("fill", "#525954")
      .style("stroke-width", "1px");

      getGlobeMarkerData();
});

function getGlobeMarkerData() {
  d3.csv('data/all_crashes.csv').then((data) => {
    globe_data = data;

    markerGroup = globe_svg.append("g");
    drawMarkers();
  });
}


function trackballAngles(pt) {
  // based on http://www.opengl.org/wiki/Trackball  
  // given a click at (x,y) in canvas coords on the globe (trackball),
  // calculate the spherical coordianates for the point as a rotation around
  // the vertical and horizontal axes
  
  var r = projection.scale();
  var c = projection.translate();
  var x = pt[0] - c[0], y = - (pt[1] - c[1]), ss = x*x + y*y;


  var z = r*r > 2 * ss ? Math.sqrt(r*r - ss) : r*r / 2 / Math.sqrt(ss);  

  var lambda = Math.atan2(x, z) * 180 / Math.PI; 
  var phi = Math.atan2(y, z) * 180 / Math.PI
  return [lambda, phi];
}

function composedRotation(λ, ϕ, γ, δλ, δϕ) {
    λ = Math.PI / 180 * λ;
    ϕ = Math.PI / 180 * ϕ;
    γ = Math.PI / 180 * γ;
    δλ = Math.PI / 180 * δλ;
    δϕ = Math.PI / 180 * δϕ;
    
    var sλ = Math.sin(λ), sϕ = Math.sin(ϕ), sγ = Math.sin(γ), 
        sδλ = Math.sin(δλ), sδϕ = Math.sin(δϕ),
        cλ = Math.cos(λ), cϕ = Math.cos(ϕ), cγ = Math.cos(γ), 
        cδλ = Math.cos(δλ), cδϕ = Math.cos(δϕ);

    var m00 = -sδλ * sλ * cϕ + (sγ * sλ * sϕ + cγ * cλ) * cδλ,
            m01 = -sγ * cδλ * cϕ - sδλ * sϕ,
                m02 = sδλ * cλ * cϕ - (sγ * sϕ * cλ - sλ * cγ) * cδλ,
        m10 = - sδϕ * sλ * cδλ * cϕ - (sγ * sλ * sϕ + cγ * cλ) * sδλ * sδϕ - (sλ * sϕ * cγ - sγ * cλ) * cδϕ,
            m11 = sδλ * sδϕ * sγ * cϕ - sδϕ * sϕ * cδλ + cδϕ * cγ * cϕ,
                 m12 = sδϕ * cδλ * cλ * cϕ + (sγ * sϕ * cλ - sλ * cγ) * sδλ * sδϕ + (sϕ * cγ * cλ + sγ * sλ) * cδϕ,
        m20 = - sλ * cδλ * cδϕ * cϕ - (sγ * sλ * sϕ + cγ * cλ) * sδλ * cδϕ + (sλ * sϕ * cγ - sγ * cλ) * sδϕ,
            m21 = sδλ * sγ * cδϕ * cϕ - sδϕ * cγ * cϕ - sϕ * cδλ * cδϕ,
                 m22 = cδλ * cδϕ * cλ * cϕ + (sγ * sϕ * cλ - sλ * cγ) * sδλ * cδϕ - (sϕ * cγ * cλ + sγ * sλ) * sδϕ;
                 
    if (m01 != 0 || m11 != 0) {
         γ_ = Math.atan2(-m01, m11);
         ϕ_ = Math.atan2(-m21, Math.sin(γ_) == 0 ? m11 / Math.cos(γ_) : - m01 / Math.sin(γ_));
         λ_ = Math.atan2(-m20, m22);
    } else {
         γ_ = Math.atan2(m10, m00) - m21 * λ;
         ϕ_ = - m21 * Math.PI / 2;
         λ_ = λ;       
    }
    
    return([λ_ * 180 / Math.PI, ϕ_ * 180 / Math.PI, γ_ * 180 / Math.PI]);
}
    
var m0 = null,
    o0;
  
function mousedown() {  // remember where the mouse was pressed, in canvas coords
  m0 = trackballAngles(d3.mouse(globe_svg._groups[0][0]));
  o0 = projection.rotate();
  d3.event.preventDefault();
}

function mousemove() {
  if (m0) {  // if mousedown
    var m1 = trackballAngles(d3.mouse(globe_svg._groups[0][0]));

    o1 = composedRotation(o0[0], o0[1], o0[2], m1[0] - m0[0], m1[1] - m0[1])


    // move to the updated rotation
    projection.rotate(o1);

    o0 = o1;
    m0 = m1;

    globe_svg.selectAll("path").attr("d", path); 
    drawMarkers();
  }

  var xx = d3.event.clientX;
  var yy = d3.event.clientY;
  //setGlobeInfo_position(current_d, xx, yy);
}

function mouseup() {
  if (m0) {
    mousemove();
    m0 = null;
  }
}

var markerGroup;

function drawMarkers() {
  globe_svg.selectAll("path").attr("d", path);
  const markers = markerGroup.selectAll('circle')
    .data(globe_data);

  const paths = markerGroup.selectAll('path')
    .data(globe_data);

  const defs = globe_defs.selectAll('linearGradient')
    .data(globe_data);

  var grads = defs
    .enter()
    .append('linearGradient')
    .merge(defs)
    .attr('id', (d,i) => { return 'grad' + String(i); })
    .attr('x1', (d) => {
      var t = projection([d.destination_latidude, d.destination_longitude]);
      var f = projection([d.departure_latitude, d.departure_longitude]);
      return t[0] > f[0] ? '0%' : '100%';
    })
    .attr('y1', (d) => {
      var t = projection([d.destination_latidude, d.destination_longitude]);
      var f = projection([d.departure_latitude, d.departure_longitude]);
      return t[1] > f[1] ? '0%' : '100%';
    })
    .attr('x2', (d) => {
      var t = projection([d.destination_latidude, d.destination_longitude]);
      var f = projection([d.departure_latitude, d.departure_longitude]);
      return t[0] > f[0] ? '100%' : '0%';
    })
    .attr('y2', (d) => {
      var t = projection([d.destination_latidude, d.destination_longitude]);
      var f = projection([d.departure_latitude, d.departure_longitude]);
      return t[1] > f[1] ? '100%' : '0%';
    })

  grads.selectAll("stop").remove();
  
  grads
    .append('stop')
    .attr('offset', '0%')
    .style('stop-color', d => {
      if (globe_settings.filters[0] == 'worldwide')
        return '#FFAB00';

      var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
      var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
      var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

      var color = 'none';
      if (iCountry != -1) {
        color = globe_settings.colors[iCountry];
      } else if (iCause != -1) {
        color = globe_settings.colors[iCause];
      } else if (iManufacturer != -1) {
        color = globe_settings.colors[iManufacturer];
      } else { return 'none' }

      return d3.hsl(color).darker(3).toString();
    })
    .style('stop-opacity', 1)

    grads
    .append('stop')
    .attr('offset', '100%')
    .style('stop-color', d => {
      var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
      var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
      var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

      var color = 'none';
      if (iCountry != -1) {
        color = globe_settings.colors[iCountry];
      } else if (iCause != -1) {
        color = globe_settings.colors[iCause];
      } else if (iManufacturer != -1) {
        color = globe_settings.colors[iManufacturer];
      } else if (globe_settings.filters[0] == 'worldwide')
        color = '#FFAB00';

      return d3.hsl(color).brighter(1.5).toString();
    })
    .style('stop-opacity', 1);

  paths
    .enter()
    .append('path')
    .merge(paths)
    .attr('d', (d) => {
      var points = [
        {x: Number(d.departure_latitude), y: Number(d.departure_longitude)},
        {x: Number(d.crash_latitude), y: Number(d.crash_longitude)},
        {x: Number(d.destination_latitude), y: Number(d.destination_longitude)},
      ];

      return path({type: "LineString", coordinates: points.map(p => {return [p.x, p.y];})});
    })
    .attr('stroke', (d,i) => {
      if (d.year > x_Destino || d.year < x_Origem)
          return 'none';

      var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase()) != -1;
      var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase()) != -1;
      var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase()) != -1;

      return (iCountry || iCause || iManufacturer || globe_settings.filters[0] == 'worldwide') ? 'url(#grad' + String(i) + ')' : 'none';
    })
    .attr('stroke-width', d => {
      return 1 + Number(d.total_occupants) / 60;
    })
    .attr('stroke-linecap', 'round')
    .style('fill', 'none')
    .attr('opacity', d => {
      if (d.year > x_Destino || d.year < x_Origem)
          return 0;

        var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
        var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
        var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

        var o = 0;
        if (globe_settings.filters[0] == 'worldwide')
          o = 1;
        else if (iCountry != -1) {
          o = 1;
        } else if (iCause != -1) {
          o = 1;
        } else if (iManufacturer != -1) {
          o = 1;
        } else { return 'none' }

        const coordinate = [d.crash_latitude, d.crash_longitude];
        gdistance = d3.geoDistance(coordinate, projection.invert([globe_winSize[0] / 2, globe_winSize[1] / 2]));
        return gdistance > 1.57 ? 'none' : o * 0.2;
    })
    .attr('id', (d) => { return `fp${d.fatality_id.trim()}`; });

  markers
    .enter()
    .append('circle')
    .merge(markers)
    .attr('cx', (d) => {
      return projection([d.crash_latitude, d.crash_longitude])[0]
    })
    .attr('cy', (d) => {
      return projection([d.crash_latitude, d.crash_longitude])[1];
    })
    .attr('data-year', (d) => {
      return d.year;
    })
    .transition()
    .duration(1000)
    .attr('fill', (d) => {
        if (d.year > x_Destino || d.year < x_Origem)
          return 'none';

        var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
        var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
        var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

        var color = 'none';
        if (globe_settings.filters[0] == 'worldwide')
          color = '#FFAB00';
        else if (iCountry != -1) {
          color = globe_settings.colors[iCountry];
        } else if (iCause != -1) {
          color = globe_settings.colors[iCause];
        } else if (iManufacturer != -1) {
          color = globe_settings.colors[iManufacturer];
        } else { return 'none' }

        const coordinate = [d.crash_latitude, d.crash_longitude];
        gdistance = d3.geoDistance(coordinate, projection.invert([globe_winSize[0] / 2, globe_winSize[1] / 2]));
        return gdistance > 1.57 ? 'none' : color;
    })
    .attr('stroke', (d) => {
      if (d.year > x_Destino || d.year < x_Origem)
          return 'none';

      var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
      var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
      var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

      var color = 'none';
      if (globe_settings.filters[0] == 'worldwide')
        color = '#FFAB00';
      else if (iCountry != -1) {
        color = globe_settings.colors[iCountry];
      } else if (iCause != -1) {
        color = globe_settings.colors[iCause];
      } else if (iManufacturer != -1) {
        color = globe_settings.colors[iManufacturer];
      } else { return 'none' }

      const coordinate = [d.crash_latitude, d.crash_longitude];
      gdistance = d3.geoDistance(coordinate, projection.invert([globe_winSize[0] / 2, globe_winSize[1] / 2]));
      return gdistance > 1.57 ? 'none' : color;
  })
    .attr('r', d => {
      return 5 + Number(d.total_fatalities) / 10;
    })
    .attr('opacity', d => {
      if (d.year > x_Destino || d.year < x_Origem)
          return 0;

        var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
        var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
        var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

        var o = 0;
        if (globe_settings.filters[0] == 'worldwide')
          o = 1;
        else if (iCountry != -1) {
          o = 1;
        } else if (iCause != -1) {
          o = 1;
        } else if (iManufacturer != -1) {
          o = 1;
        } else { return 'none' }

        const coordinate = [d.crash_latitude, d.crash_longitude];
        gdistance = d3.geoDistance(coordinate, projection.invert([globe_winSize[0] / 2, globe_winSize[1] / 2]));
        return gdistance > 1.57 ? 'none' : o;
    })
    .attr('fill-opacity', 0.2);

    markerGroup.selectAll('circle')
      .on('mouseenter', setGlobeInfo)
      .on('mousemove', setGlobeInfo)
      .on('mouseleave', clearGlobeInfo);

    if (info_text == null) info_text = globe_svg
      .append("g");
}

current_d = null;

function setGlobeInfo(d) {
  var xx = d3.event.clientX;
  var yy = d3.event.clientY;
  setGlobeInfo_position(d, xx, yy);
  current_d = d;
}

function setGlobeInfo_position(d, xx, yy) {
  if (d == null) return;

  markerGroup.selectAll('circle').attr('fill-opacity', 0.2)
    .style('filter', 'none');
  markerGroup.selectAll('path').attr('opacity', 0.2);

  d3.select(d3.event.target).attr('fill-opacity', 0.8)
    .style('filter', (d) => {
      if (d.year > x_Destino || d.year < x_Origem)
        return 'none';

      var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
      var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
      var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

      var color = 'none';
      if (globe_settings.filters[0] == 'worldwide')
        color = '#FFAB00';
      else if (iCountry != -1) {
        color = globe_settings.colors[iCountry];
      } else if (iCause != -1) {
        color = globe_settings.colors[iCause];
      } else if (iManufacturer != -1) {
        color = globe_settings.colors[iManufacturer];
      } else { return 'none' }

      return `drop-shadow(0 0 10px ${color}) brightness(150%)`;
  });

  markerGroup.select(`#fp${d.fatality_id.trim()}`).attr('opacity', 1);

  $("#globe-info_year").html(d.year.trim());
  $("#globe-info_comp-country").html(d.company_country.trim());
  $("#globe-info_cause").html(d.cause.trim());
  $("#globe-info_nature").html(d.nature.trim());
  $("#globe-info_passengers").html(d.total_occupants.trim());
  $("#globe-info_deaths").html(d.total_fatalities.trim());
  $("#globe-info").css("opacity", "1")
    .css("top", yy + 10 + "px")
    .css("left", xx + 10 + "px");

}

function clearGlobeInfo() {
  markerGroup.selectAll('circle').attr('fill-opacity', 0.2)
    .style("filter", "none");
  markerGroup.selectAll('path').attr('opacity', 0.2);
  $("#globe-info").css("opacity", "0");
}

function addInfoLine(s, y, xx, yy) {
  info_text.append('text')
  .attr('x', xx + 10)
  .attr('y', yy + 20 + y * 20)
  .style('fill', 'white')
  .style('font-size', '10pt')
  .text(s);
}

function updateGlobeData(filters, colors) {
  globe_settings = {
    filters: filters.map((f) => f.toLowerCase()),
    colors: colors
  }
  drawMarkers();
}

function wheelZoom() {
  var amount = d3.event.deltaY * 5;
  radius -= amount;
  radius = Math.min(Math.max(radius, 80), 1000);
  projection.scale(radius);
  globe_base.attr('r', radius);

  globe_svg.selectAll("path").attr("d", path); 
  drawMarkers();
}

function highlightGlobeYear(year) {
  if (year) {
    markerGroup.selectAll(`circle`)
      .attr("fill-opacity", 0.2)
      .style("filter", "none");
    markerGroup.selectAll(`circle[data-year = "${year}"]`)
      .attr("fill-opacity", 0.8)
      .style('filter', (d) => {
        if (d.year > x_Destino || d.year < x_Origem)
          return 'none';

        var iCountry = globe_settings.filters.indexOf(d.company_country.trim().toLowerCase());
        var iCause = globe_settings.filters.indexOf(d.cause.trim().toLowerCase());
        var iManufacturer = globe_settings.filters.indexOf(d.nature.trim().toLowerCase());

        var color = 'none';
        if (globe_settings.filters[0] == 'worldwide')
          color = '#FFAB00';
        else if (iCountry != -1) {
          color = globe_settings.colors[iCountry];
        } else if (iCause != -1) {
          color = globe_settings.colors[iCause];
        } else if (iManufacturer != -1) {
          color = globe_settings.colors[iManufacturer];
        } else { return 'none' }

        return `drop-shadow(0 0 10px ${color}) brightness(150%)`;
    });
  } else {
    markerGroup.selectAll(`circle`)
      .attr("fill-opacity", 0.2)
      .style("filter", "none");
  }
  

}