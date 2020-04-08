
const width = 800;
const height = width * 0.7;
let projection; 
let plane_path;
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

// const covidDataUrl = "https://cors-anywhere.herokuapp.com/https://opendata.ecdc.europa.eu/covid19/casedistribution/json/";
const covidDataUrl = "covid-data.json";
const worldMapUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";

let dateFormatter = new Intl.DateTimeFormat('en', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
}) 
const colorScale = d3.scaleLinear().domain([0,100]).range(["#ede", "#62e"])




function initialize() {
    
    projection = d3.geoMercator()
        .scale(width / 2 / Math.PI)
        //.scale(100)
        .translate([width / 2, height *0.7]);
    plane_path = d3.geoPath().projection(projection);
    svg = d3.select("#container").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "map");
    
    geopath = d3.geoPath().projection(projection);

    label = document.getElementById('t')
    label.innerHTML = "Loading data (be patient)..."

    slider = document.getElementById('slider')
    slider.value = 100
    slider.oninput = onSliderChanged

    tooltip = d3.select("body")
        .append("div")
        .attr("id", "mytooltip")
        .style("position", "absolute")
        .style("z-index", "10")
        .style("visibility", "hidden")
        .text("tooltip");

    Promise.all([
        fetch(covidDataUrl).then(d=>d.json()).then(processCovidData),
        fetch(worldMapUrl).then(d=>d.json()).then(processWorldMap),
        fetch("faostat.json").then(d=>d.json()).then(d=>faoRawData = d)
    ]).then(()=>{
        integrateFaoData()
        buildMap()
        label.innerHTML = dateFormatter.format(currentDate)
    })


    // load and display the World
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson", 
        function(error, data) {
            data.features.forEach(d => {
                d.centroid = projection(d3.geoCentroid(d));                
            });
            topo = data
    });
}

window.onload = initialize


function processCovidData(data) {
    console.log("processing COVID-19 data")
    covidRawData = data
    data.records.forEach(rec => {
        
        let date = new Date(rec.month+"/"+rec.day+"/"+rec.year)
        let item_t = covidData[date] 
        if(item_t === undefined) item_t = covidData[date] = {}
        let countryCode =  rec.countryterritoryCode
        if(nameByCountryCode[countryCode]===undefined) {
            countryCodes.push(countryCode)
            nameByCountryCode[countryCode] = rec.countriesAndTerritories
            countryCodeByName[rec.countriesAndTerritories] = countryCode
        }
        let item_c = item_t[countryCode]
        if(item_c === undefined) item_c = item_t[countryCode] = {}
        item_c.cases = rec.cases|0
        item_c.deaths = rec.deaths|0
    })

    for(let t in covidData) dates.push(new Date(t))    
    dates.sort((a,b) => a.getTime()-b.getTime())

    let oldValues = {}
    dates.forEach(d => {
        let rec = covidData[d]
        countryCodes.forEach(c => {
            if(rec[c] === undefined) rec[c] = oldValues[c]
            else oldValues[c] = rec[c]
        })
    })

    currentDate = dates[dates.length-1]
    currentRecord = covidData[currentDate]
}

function processWorldMap(data) {
    console.log("processing world map")
    worldMap = data
    data.features.forEach(d => {
        d.centroid = projection(d3.geoCentroid(d));                
    });
}

function integrateFaoData() {
    faoRawData.forEach(d => {
        let c = countryCodeByName[d.name]
        if(c === undefined) console.log("not found: ", d.name)
        else faoValues[c] = d.value
    })
}


function getBubbleRadius(countryCode) {
    let data = currentRecord[countryCode];
    if(data === undefined) return 0;
    let c = data.cases
    if(c==0) return 0;
    return 3*Math.log(c)
}

function getFaoColor(countryCode) {
    let v = faoValues[countryCode]
    if(v === undefined || v<0) return "#eee";
    else return colorScale(v);
}


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

function setTime(t) {
    let rec = covidData[t]
    if(rec === undefined) return;
    currentDate = t
    currentRecord = rec;
    d3.selectAll('.bubble').attr("r", d => getBubbleRadius(d.id))
}

function onSliderChanged() {
    let i = Math.min(dates.length-1, Math.floor(dates.length*this.value*0.01))
    setTime(dates[i])
    label.innerHTML = dateFormatter.format(dates[i])
}

function showTooltip(countryCode) {

    let data = currentRecord[countryCode];
    let fv = faoValues[countryCode]
    
    let content = "<h1>"+nameByCountryCode[countryCode]+"</h1><table>" +
        "<tr><th>Fao</th><td>"+(fv>0 ? fv + "%" : "")+"</td></tr>" + 
        "<tr><th>Cases</th><td>"+(data?data.cases:0)+"</td></tr>" + 
        "<tr><th>Deaths</th><td>"+(data?data.deaths:0)+"</td></tr>" + 
        "</table>";
        

    d3.select("#mytooltip")
        .style("visibility", "visible")
        .html(content)
        .style("top", (d3.event.pageY-10)+"px") 
        .style("left",(d3.event.pageX+10)+"px")
}

function hideToolTip() {
    d3.select("#mytooltip").style("visibility", "hidden")
}
