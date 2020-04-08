
let coviddata = {}
let namesByCountryCode = {}
let times = []
let currentDate
let currentRecord
let theMap


function processCovidData(data) {
    coviddata2 = data
    console.log("qui")
    let records = data.records

    records.forEach(rec => {
        
        let date = new Date(rec.month+"/"+rec.day+"/"+rec.year)
        let item_t = coviddata[date] 
        if(item_t === undefined) item_t = coviddata[date] = {}
        let countryCode =  rec.countryterritoryCode
        if(namesByCountryCode[countryCode]===undefined)
            namesByCountryCode[countryCode] = rec.countriesAndTerritories
        let item_c = item_t[countryCode]
        if(item_c === undefined) item_c = item_t[countryCode] = {}
        item_c.cases = rec.cases|0
        item_c.deaths = rec.deaths|0
    })

    for(let t in coviddata) times.push(new Date(t))    
    times.sort()
    currentDate = times[times.length-1]
    currentRecord = coviddata[currentDate]
}

function init() {

    console.log("qua")
    fetch("https://cors-anywhere.herokuapp.com/https://opendata.ecdc.europa.eu/covid19/casedistribution/json/")
        .then(d=>d.json())
        .then(d=>processCovidData(d));


    var series = [
        ["BLR",75],["BLZ",43],["RUS",50],["RWA",88],["SRB",21],["TLS",43],
        ["REU",21],["TKM",19],["TJK",60],["ROU",4],["TKL",44],["GNB",38],
        ["GUM",67],["GTM",2],["SGS",95],["GRC",60],["GNQ",57],["GLP",53],
        ["JPN",59],["GUY",24],["GGY",4],["GUF",21],["GEO",42],["GRD",65],
        ["GBR",14],["GAB",47],["SLV",15],["GIN",19],["GMB",63],["GRL",56],
        ["ERI",57],["MNE",93],["MDA",39],["MDG",71],["MAF",16],["MAR",8],
        ["MCO",25],["UZB",81],["MMR",21],["MLI",95],["MAC",33],["MNG",93],
        ["MHL",15],["MKD",52],["MUS",19],["MLT",69],["MWI",37],["MDV",44],
        ["MTQ",13],["MNP",21],["MSR",89],["MRT",20],["IMN",72],["UGA",59],
        ["TZA",62],["MYS",75],["MEX",80],["ISR",77],["FRA",54],["IOT",56],
        ["SHN",91],["FIN",51],["FJI",22],["FLK",4],["FSM",69],["FRO",70],
        ["NIC",66],["NLD",53],["NOR",7],["NAM",63],["VUT",15],["NCL",66],
        ["NER",34],["NFK",33],["NGA",45],["NZL",96],["NPL",21],["NRU",13],
        ["NIU",6],["COK",19],["XKX",32],["CIV",27],["CHE",65],["COL",64],
        ["CHN",16],["CMR",70],["CHL",15],["CCK",85],["CAN",76],["COG",20],
        ["CAF",93],["COD",36],["CZE",77],["CYP",65],["CXR",14],["CRI",31],
        ["CUW",67],["CPV",63],["CUB",40],["SWZ",58],["SYR",96],["SXM",31]];


    // Datamaps expect data in format:
    // { "USA": { "fillColor": "#42a844", numberOfWhatever: 75},
    //   "FRA": { "fillColor": "#8dc386", numberOfWhatever: 43 } }
    var dataset = {};

    // We need to colorize every country based on "numberOfWhatever"
    // colors should be uniq for every value.
    // For this purpose we create palette(using min/max series-value)
    var onlyValues = series.map(function(obj){ return obj[1]; });
    var minValue = Math.min.apply(null, onlyValues),
            maxValue = Math.max.apply(null, onlyValues);

    // create color palette function
    // color can be whatever you wish
    var paletteScale = d3.scale.linear()
            .domain([minValue,maxValue])
            .range(["#EFEFFF","#02386F"]); // blue color

    // fill dataset in appropriate format
    series.forEach(function(item){ //
        // item example value ["USA", 70]
        var iso = item[0],
                value = item[1];
        dataset[iso] = { numberOfThings: value, fillColor: paletteScale(value) };
    });

    // render map
    theMap = new Datamap({
        element: document.getElementById('container1'),
        projection: 'mercator', // big world map
        // countries don't listed in dataset will be painted with this color
        fills: { defaultFill: '#F5F5F5' },
        data: dataset,
        geographyConfig: {
            borderColor: '#DEDEDE',
            highlightBorderWidth: 2,
            // don't change color on mouse hover
            highlightFillColor: function(geo) {
                return geo['fillColor'] || '#F5F5F5';
            },
            // only change border
            highlightBorderColor: '#B7B7B7',
            // show desired information in tooltip
            popupTemplate: function(geo, data) {
                // don't show tooltip if country don't present in dataset
                if (!data) { return ; }
                // tooltip content
                return ['<div class="hoverinfo">',
                    '<strong>', geo.properties.name, '</strong>',
                    '<br>Count: <strong>', data.numberOfThings, '</strong>',
                    '</div>'].join('');
            }
        }
    });
}

window.onload = init

function addBubbles()
{
    let bubbles = [
        {
            name: "test",
            radius: 25,
            yield: 400,
            fillKey: "RUS",
        }
    ]
    theMap.bubbles(bubbles)
}
    /*


let geodata
let coviddata 


window.onload=function() {
    
    const urls = [
        "world.geo.json",
        "https://pomber.github.io/covid19/timeseries.json",
        // "https://restcountries.eu/rest/v2/region/Africa",
    ]
    Promise.all([
        fetch("world.geo.json")
            .then(resp=>resp.json())
            .then(d => geodata = d),
        fetch("https://pomber.github.io/covid19/timeseries.json")
            .then(resp=>resp.json())
            .then(d => coviddata = d)
    ])
    .then(() => {
        
        foo()
    })
}

function foo() {
    var projection = d3.geoEquirectangular();
    var geoGenerator = d3.geoPath()
        .projection(projection);

        
    var u = d3.select('#content g.map')
    .selectAll('path')
    .data(geodata.features);
    
    u.enter()
      .append('path')
      .attr('d', geoGenerator);
    
    var centroids = geodata.features.map(function (feature){
        var pos = geoGenerator.centroid(feature);
        return {"name":feature.properties.name_long, "pos":pos }
      });

    var c = d3.select('#content g.map')
    .selectAll(".centroid").data(centroids)
    .enter().append("circle")
      .attr("class", "centroid")
      .attr("fill", 'red')
      .attr("stroke-width", 1)
      .attr("opacity", 0.5)
      .attr("r", function(d) { 
          var q = coviddata[d.name]
          if(q === undefined) {
              console.log(d.name)
              return 0;
          } else {
              let confirmed = coviddata[d.name][76].confirmed;
              if(confirmed > 0) 
                  return Math.min(10, Math.log(confirmed));
              else 
                    return 0;
          }
        })
      .attr("cx", function (d){ return d.pos[0]; })
      .attr("cy", function (d){ return d.pos[1]; });
}
*/
