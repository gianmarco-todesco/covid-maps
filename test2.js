"use strict";

var series = [
    ["BLZ",13.5],["GRL",9.1],["KEN",12.6],["BLR",22.1],["SDN",34.7],["GRD",38.9],["RWA",24.9],["GRC",11.1],["ERI",8.1],["TJK",10.4],["AFG",11.4],["CRI",14.8],["GEO",11.7],["LKA",18.3],["MDV",24.4],["ARM",12.2],["ARG",13.1],["HKG",16.1],["ARE",15],["VIR",8.3],["MDG",29.1],["VUT",11.6],["MDA",13.6],["IDN",12.4],["TUR",10.9],["SOM",16.8],["TUN",13.4],["RUS",12.3],["MCO",36],["MOZ",19.6],["LVA",10.1],["FJI",17.5],["BWA",22.3],["CPV",8.6],["LUX",11.6],["DJI",8.3],["NIC",10],["LIE",9.7],["ECU",9.2],["TTO",16.2],["THA",13.8],["PHL",13.4],["FIN",13],["HUN",10.9],["SAU",13],["UZB",15.3],["TGO",-2.3],["QAT",12.5],["LTU",10.7],["COL",15.5],["GBR",12.1],["MNG",6.1],["BIH",10.6],["MNE",11.1],["COG",19.3],["KAZ",11.8],["MAR",10.8],["SYR",15.6],["GNQ",8.2],["KNA",7.7],["ABW",20],["IND",12.4],["OMN",11.4],["MMR",3],["BHS",14.1],["HTI",26.4],["BHR",10.7],["MAC",18.7],["SYC",20.3],["SLV",18.3],["NGA",15.2],["MYS",12.5],["LSO",14.1],["BTN",8.1],["IMN",13.4],["PRY",11.6],["PRT",11.7],["AND",11],["SLB",9.3],["SXM",8.4],["GAB",8.3],["CAN",12.7],["CZE",11.7],["MLT",12.1],["VEN",23.6],["BGR",11.3],["PRK",10.9],["UKR",12.6],["AZE",13.6],["CMR",20.2],["PRI",15.3],["REU",21.8],["GMB",15.4],["MLI",7.8],["SWZ",13.9],["PER",15],["BGD",11.3],["CYP",13],["HRV",21.2],["CYM",11.4],["JEY",0.2],["FRO",8.3],["SWE",11.4],["MKD",12.5],["FRA",12.5],["KWT",14.2],["BRN",13.4],["BFA",8.2],["MWI",22.7],["VCT",7.9],["DEU",11.4],["SVN",12.4],["ALB",13],["ALA",15.3],["SVK",11.9],["BRB",16.9],["BRA",11.9],["BES",8.5],["BEN",8.4],["BEL",11.4],["NPL",12],["TCD",13.5],["ROU",11],["TCA",8],["JPN",12.8],["SUR",23.5],["NCL",14.4],["POL",12],["NOR",13.2],["MUS",39.9],["VNM",12.4],["BDI",-0.5],["LCA",23.3],["JOR",11.8],["LBY",15.8],["ZAF",12.7],["GUY",14.6],["LBR",14.3],["CIV",22.4],["LBN",13.6],["GUM",20.7],["GIB",11.2],["PNG",9.2],["ZMB",12.6],["TZA",15.9],["CUW",10.4],["DOM",12.8],["WSM",8.2],["KHM",11.7],["SGP",14.5],["BOL",20],["NZL",12.4],["PAN",12.1],["AUT",9.3],["UGA",12.2],["AUS",11.5],["PAK",11.8],["NAM",11.3],["KGZ",16.7],["CUB",11.6],["USA",12.8],["LAO",16.7],["SSD",8.5],["HND",15.6],["GTM",15.2],["URY",11.6],["GHA",26.4],["CHN",12.7],["CHL",11.2],["JAM",14.8],["TLS",8.4],["ITA",11.7],["DNK",11],["GGY",32.9],["CHE",11.8],["ETH",13.6],["PLW",13.2],["EGY",11.7],["YEM",15.8],["ISR",12.5],["ISL",13],["ATG",8.1],["DZA",12.9],["EST",10.9],["SRB",12.1],["MRT",9.1],["ESP",13.1],["BMU",20.3],["SEN",22.1],["AGO",8.4],["ZWE",17.7],["NLD",10.2],["TKM",17.9],["DMA",8.3],["MEX",13.8],["IRQ",9.7],["TWN",11.3],["IRN",9.8],["IRL",11.5]
];

const valueTable = {};
let valueRange = [
    series.map(v=>v[1]).reduce((a,b)=>Math.min(a,b)),
    series.map(v=>v[1]).reduce((a,b)=>Math.max(a,b))    
]
series.forEach(item => valueTable[item[0]] = item[1]);

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

const boundaryColor = '#bbb';

// formatter for the current date
let dateFormatter = new Intl.DateTimeFormat('en', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
}) 

// color scale for PoU index
const colorScale = d3.scaleLinear().domain(valueRange)
    .range(["#eee", "#2e4"])

const worldMapUrl = "geo_un_simple_boundaries.geojson";

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

    // create the tooltip
    createTooltip();

    // fetch all the data
    Promise.all([
        fetch(worldMapUrl).then(d=>d.json()).then(processWorldMap),
    ]).then(()=>{
        buildMap()
    })
}

window.onload = initialize

// process the map data. compute the centroid for each path
function processWorldMap(data) {
    console.log("processing world map")
    worldMap = data
    /*

    data.features.forEach(d => {
        d.centroid = projection(d3.geoCentroid(d));                
    });
    */
}

function getValueColor(countryCode) {
    let v = valueTable[countryCode]
    if(v === undefined) return '#eee';
    else return colorScale(v);
}

// we have the data and we can build the map
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
            console.log(d.properties.ROMNAM);
            console.log(d.properties);
            showTooltip(d.properties.ISO3CD, d.properties.ROMNAM);
        })
        .on("mousemove", function(d) {showTooltip(d.properties.ISO3CD, d.properties.ROMNAM)})
        .on("mouseout", function(d,i) {
            d3.select(this).style('stroke', boundaryColor);
            hideToolTip();
        })
        
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


let ddata;


// visualize the tooltip
function showTooltip(countryCode, countryName) {
    
    let content = "<strong>" + countryName + "</strong><br>Value = " + valueTable[countryCode];
          
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

