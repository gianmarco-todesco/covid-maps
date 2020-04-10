"use strict";

let projection; 
let svg;
let geopath;
let worldMap;
let tooltip

const boundaryColor = '#bbb';

// formatter for the current date
let dateFormatter = new Intl.DateTimeFormat('en', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
}) 

const worldMapUrl = "geo_un_simple_boundaries.geojson";

// initialize the page and fetch needed data
function initialize() {
    const container = d3.select("#map-container");
    const width = container.node().clientWidth;
    const height = container.node().clientHeight;
    
    // we use Mercator projection
    projection = d3.geoMercator()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height *0.7]);

    // create the SVG element
    svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "map");
    
    // geopath transforms GeoJson feature into SVG path 
    geopath = d3.geoPath().projection(projection);

    // create the tooltip
    createTooltip();

    createLegend();

    // fetch the map
    fetch(worldMapUrl).then(d=>d.json()).then(d=>worldMap = d).then(buildMap);
}

window.onload = initialize

// return a color for a given country code
function getValueColor(countryCode) {
    let v = valueTable[countryCode]
    if(v === undefined) return '#eee';
    else return colorScale(v);
}

// build the map
function buildMap() {
    let g = svg.append("g");

    // add countries
    let paths = g.selectAll("path")
        .data(worldMap.features.filter(f=>f.properties.ISO3CD != "ATA"))
        .enter()
        .append("path")
        .attr("d", geopath)
        .style('fill', d => getValueColor(d.properties.ISO3CD))
        .style('stroke', boundaryColor);

    // handle tooltip
    paths
        .on("mouseover", function(d,i) {
            d3.select(this).style('stroke', 'black');
            showTooltip(d.properties.ISO3CD, d.properties.MAPLAB);
        })
        .on("mousemove", function(d) {showTooltip(d.properties.ISO3CD, d.properties.ROMNAM)})
        .on("mouseout", function(d,i) {
            d3.select(this).style('stroke', boundaryColor);
            hideToolTip();
        })      
}

// create a tooltip (see .css file for look&feel)
function createTooltip() {
    tooltip = d3.select("body")
        .append("div")
        .attr("id", "mytooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .append("div").attr("class", "tooltip-text")
}


// visualize & hide the tooltip
function showTooltip(countryCode, countryName) {
    
    let content = "<strong>" + countryName + "</strong>" + 
        "<br>Value = " + valueTable[countryCode];
          
    d3.select("#mytooltip ")
        .style("visibility", "visible")
        .style("top", (d3.event.pageY+10)+"px") 
        .style("left",(d3.event.pageX+10)+"px")

    d3.select("#mytooltip .tooltip-text")
        .html(content)
}

function hideToolTip() {
    d3.select("#mytooltip").style("visibility", "hidden")
}

function createLegend() {

    const legendContainer = d3.select("#legend");
    const w = legendContainer.node().clientWidth;
    const h = legendContainer.node().clientHeight;
    
    var key = legendContainer
      .append("svg")
      .attr("width", w)
      .attr("height", h);

    var legend = key.append("defs")
      .append("svg:linearGradient")
      .attr("id", "gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "100%")
      .attr("y2", "100%")
      .attr("spreadMethod", "pad");

    legend.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", colorScale(valueRange[0]))
      .attr("stop-opacity", 1);

    legend.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", colorScale(valueRange[1]))
      .attr("stop-opacity", 1);

    key.append("rect")
      .attr("width", w)
      .attr("height", h - 30)
      .style("fill", "url(#gradient)")
      .attr("transform", "translate(0,10)");

    var y = d3.scaleLinear()
      .range([0, w])
      .domain(valueRange);

    var yAxis = d3.axisBottom()
      .scale(y)
      .ticks(5);

    key.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0,30)")
      .call(yAxis)

/*      
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 0)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("axis title");
      */
}
