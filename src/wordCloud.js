var fill = d3.scaleOrdinal();

// d3.csv('data/word_counts.csv').then(function(data) {
//   renderWordCloud(data);
// }); 
var maxFontSize = 90;
var width = $('#word-cloud').width();
var height = $('#word-cloud').height();
var minDegreeRot = -45;
var maxDegreeRot = 45;
var numberOfOrientations = 5;
var randomDegrees = [];
for (let i = 0; i < numberOfOrientations; i++) {
  randomDegrees.push(Math.random() * (maxDegreeRot - minDegreeRot) + minDegreeRot);
}

var wordCloud = d3.select("#word-cloud").append("svg")
    .attr("width", width)
    .attr("height", height)
  .append("g")
    .attr("transform", "translate(" + width / 2 + "," + (height + 50) / 2 + ")");

function draw(words) {
  var cloud = wordCloud.selectAll("g text")
                  .data(words, function(d) { return d.text; })

  //Entering words
  cloud.enter()
      .append("text")
      .attr("text-anchor", "middle")
      .attr('font-size', 1)
      .text(function(d) { return d.text; });

  //Entering existing words
  cloud.transition()
          .duration(1000)
          .style("font-size", function(d) { return d.size + "px"; })
          .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .style("fill-opacity", 1);

  //Exiting words
  cloud.exit()
      .transition()
          .duration(200)
          .style('fill-opacity', 1e-6)
          .attr('font-size', 1)
          .remove();
}

function updateWordCloud(begin, end) {
  alasql(`SELECT words as text, SUM(c) AS size FROM ? WHERE year >= ${begin} AND year <= ${end} GROUP BY words ORDER BY size DESC LIMIT 100`, [words], function(data) {

    const maxCount = data[0].size;

    d3.layout.cloud().size([width, height])
      .words(data)
    .padding(2)
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .fontSize(function(d) { 
        return Math.sqrt(d.size) * 50 / Math.sqrt(maxCount); })
      .on("end", draw)
      .start();
  });      
}
var words = [];
alasql(`SELECT * FROM CSV("data/words.csv",{headers:true})`, [], function(data) {
  words = data;
  updateWordCloud(1970, 2017);
  updateWordCloud(1970, 2017);
});
