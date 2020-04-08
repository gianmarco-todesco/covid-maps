"use strict";

const width = 800;
const height = width * 0.7;
let projection; 
let svg;

let geopath;

let worldMap;

let dates = []
let currentDate
let currentRecord

let countryCodes = []
let nameByCountryCode = {}
let countryCodeByName = {}
let covidData = {}
let covidRawData

let faoRawData 
let faoValues = {}

let tooltip
let slider
let label

let mygraph

// const covidDataUrl = "https://cors-anywhere.herokuapp.com/https://opendata.ecdc.europa.eu/covid19/casedistribution/json/";
const covidDataUrl = "covid-data.json";
const worldMapUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

// formatter for the current date
let dateFormatter = new Intl.DateTimeFormat('en', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
}) 

// color scale for PoU index
const colorScale = d3.scaleLinear().domain([0,100]).range(["#ded", "#2e4"])


// initialize the page and fetch needed data
function initialize() {
    
    // we use Mercator projection
    projection = d3.geoMercator()
        .scale(width / 2 / Math.PI)
        //.scale(100)
        .translate([width / 2, height *0.7]);

    // create the SVG element
    svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "map");
    
    // geopath transforms GeoJson feature into SVG path 
    geopath = d3.geoPath().projection(projection);

    // the label shows the current date
    label = document.getElementById('t')
    label.innerHTML = "Loading data (be patient)..."

    // the slider control the current date
    slider = document.getElementById('slider')
    slider.value = 100
    slider.oninput = onSliderChanged

    // create the tooltip
    createTooltip();

    // fetch all the data
    Promise.all([
        fetch(covidDataUrl).then(d=>d.json()).then(processCovidData),
        fetch(worldMapUrl).then(d=>d.json()).then(processWorldMap),
        fetch("faostat.json").then(d=>d.json()).then(d=>{
            faoRawData = d
            faoRawData.forEach(r => faoValues[r.code] = r.value) 
        })
    ]).then(()=>{
        buildMap()
        label.innerHTML = dateFormatter.format(currentDate)
    })
}

window.onload = initialize

// process covid data
// create a dictonary of dictionaries: date => countrycode => { cases: ..., deaths: ...}
function processCovidData(data) {
    console.log("processing COVID-19 data")
    covidRawData = data
    data.records.forEach(rec => {
        // build the date
        let date = new Date(rec.month+"/"+rec.day+"/"+rec.year)

        // get or create covidData[date] 
        let item_t = covidData[date] 
        if(item_t === undefined) item_t = covidData[date] = {}

        // keep track of seen country codes. 
        // Updates nameByCountryCode[] and countryCodeByName
        let countryCode =  rec.countryterritoryCode
        if(nameByCountryCode[countryCode]===undefined) {
            countryCodes.push(countryCode)
            nameByCountryCode[countryCode] = rec.countriesAndTerritories
            countryCodeByName[rec.countriesAndTerritories] = countryCode
        }

        // get or create covidData[date][countryCode]
        let item_c = item_t[countryCode]
        if(item_c === undefined) item_c = item_t[countryCode] = {}

        // assign data (0 if they are undefined)
        item_c.cases = rec.cases|0
        item_c.deaths = rec.deaths|0
    })

    // collect all the used dates and sort them
    for(let t in covidData) dates.push(new Date(t))    
    dates.sort((a,b) => a.getTime()-b.getTime())

    // fill gaps in the data
    /*
    let oldValues = {}
    dates.forEach(d => {
        let rec = covidData[d]
        countryCodes.forEach(c => {
            if(rec[c] === undefined) rec[c] = oldValues[c]
            else oldValues[c] = rec[c]
        })
    })
    */

    currentDate = dates[dates.length-1]
    currentRecord = covidData[currentDate]
}

// process the map data. compute the centroid for each path
function processWorldMap(data) {
    console.log("processing world map")
    worldMap = data
    data.features.forEach(d => {
        d.centroid = projection(d3.geoCentroid(d));                
    });
}

// get the bubble radius reprenting the number
// of confirmed covid-19 cases for a given country
function getBubbleRadius(countryCode) {
    let data = currentRecord[countryCode];
    // we have no data: return 0
    if(data === undefined) return 0;
    let c = data.cases
    if(c==0) return 0;
    // there are some cases. The radius is proportional to the log of nr. of cases
    return 3*Math.log(c)
}

// get the color representing the PoU of the given country
function getFaoColor(countryCode) {
    let v = faoValues[countryCode]
    if(v === undefined || v<0) return "#eee";
    else return colorScale(v);
}

// we have the data and we can build the map
function buildMap() {

    let g = svg.append("g");
    // add countries
    let paths = g.selectAll("path")
        .data(worldMap.features)
        .enter()
        .append("path")
        .attr("d", geopath)
        .style('fill', d => getFaoColor(d.id))
        .style('stroke', 'none');

    // handle tooltip
    paths
        .on("mouseover", function(d,i) {
            d3.select(this).style('stroke', 'magenta');
            showTooltip(d.id);
        })
        .on("mousemove", function(d) {showTooltip(d.id)})
        .on("mouseout", function(d,i) {
            d3.select(this).style('stroke', 'none');
            hideToolTip();
        })
        
    // add bubbles
    g.selectAll("circle")
    .data(worldMap.features)
        .enter()
        .append("circle")
        .attr("r", d => getBubbleRadius(d.id))
        .attr("cx", d=>d.centroid[0])
        .attr("cy", d=>d.centroid[1])
        .attr("class", "bubble")
        .style('fill', 'rgba(255,50,50,0.2)')
        .style('stroke', '#844')
        .style('stroke-width', 0.5)
        .attr('pointer-events', 'none')
        // .style('opacity', '0.2');
}

// change the current date
function setTime(t) {
    let rec = covidData[t]
    if(rec === undefined) return;
    currentDate = t
    currentRecord = rec;
    d3.selectAll('.bubble').attr("r", d => getBubbleRadius(d.id))
}

// slider callback
function onSliderChanged() {
    let i = Math.min(dates.length-1, Math.floor(dates.length*this.value*0.01))
    setTime(dates[i])
    label.innerHTML = dateFormatter.format(dates[i])
}

function createTooltip() {
    tooltip = d3.select("body")
        .append("div")
        .attr("id", "mytooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
    let tooltipText = tooltip.append("div").attr("class", "tooltip-text")
}

function createSmallChart() {
    let parent = tooltip;
    let gWidth = 150;
    let gHeight = 100;
    let gsvg = tooltip.append("svg")
        .attr("width", gWidth)
        .attr("height", gHeight)
        .attr("class", "smallMap");
    let g = gsvg.append('g').attr("transform", "translate(10,10)")
    
    var x = gsvg.xScale = d3.scaleTime()
        .domain([dates[0], dates[dates.length-1]])
        .range([ 0, gWidth-20 ]);
    g.append("g")
        .attr("transform", "translate(0," + (gHeight-20) + ")")
        .call(d3.axisBottom(x).tickFormat(""));

    var y = gsvg.yScale = d3.scaleLog()
        .domain([1, 10e5])
        .range([ gHeight-20, 0 ]);
    g.append("g")
        .call(d3.axisLeft(y).tickFormat(""));

    gsvg.g = g;
    parent.smallChart = gsvg;

}

let ddata;

function updateSmallChart(countryCode) {
    if(tooltip.smallChart === undefined) createSmallChart();
    let smallChart = tooltip.smallChart;
    let data = dates.map(d => {
        let v = 0.0;
        if(covidData[d] && covidData[d][countryCode])
            v = covidData[d][countryCode].cases;
        return {date:d, value:v};
    });
    ddata = data;
    let x = smallChart.xScale;
    let y = smallChart.yScale;

    smallChart.selectAll(".line").remove()
    smallChart.g.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
            .x(function(d) { return x(d.date) })
            .y(function(d) { return y(Math.max(1,d.value)) })
        )
}


// visualize the tooltip
function showTooltip(countryCode) {
    let data = currentRecord[countryCode];
    let fv = faoValues[countryCode]
    
    let content = "<h1>"+nameByCountryCode[countryCode]+"</h1><table>" +
        "<tr><th>PoU</th><td>"+(fv>0 ? fv + "%" : "")+"</td></tr>" + 
        "<tr><th>Cases</th><td>"+(data?data.cases:0)+"</td></tr>" + 
        "<tr><th>Deaths</th><td>"+(data?data.deaths:0)+"</td></tr>" + 
        "</table>";
          
    d3.select("#mytooltip ")
        .style("visibility", "visible")
        .style("top", (d3.event.pageY-10-200)+"px") 
        .style("left",(d3.event.pageX+10)+"px")

    d3.select("#mytooltip .tooltip-text")
        .html(content)
    updateSmallChart(countryCode)
}

function hideToolTip() {
    d3.select("#mytooltip").style("visibility", "hidden")
}


function foo() {

    let data = dates.map(d => {
        let v = 0.0;
        if(covidData[d] && covidData[d]['ITA'])
            v = covidData[d]['ITA'].cases;
        return {date:d, value:v};
    });

    let gWidth = 800;
    let gHeight = 500;

    mygraph = d3.select("body").append("div")
        .attr("id", "mygraph")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("width", gWidth + "px")
        .style("height", gHeight + "px")
        .style("left", "20px")
        .style("top", "20px")
        .style("background-color","white")
    let mysvg = mygraph.append("svg")
        .attr("width", gWidth)
        .attr("height", gHeight)
        .attr("class", "map");

    
    var x = d3.scaleTime()
        .domain(d3.extent(data, function(d) { return d.date; }))
        .range([ 0, gWidth ]);
    mysvg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) { return +d.value; })])
        .range([ gHeight, 0 ]);
    mysvg.append("g")
        .call(d3.axisLeft(y));

    mysvg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
        .x(function(d) { return x(d.date) })
        .y(function(d) { return y(d.value) })
        )

    
}