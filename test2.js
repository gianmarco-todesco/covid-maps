"use strict";


class NiceMap {

    constructor(options) {
        const container = this.container = d3.select("#" + options.containerId);
        const width = container.node().clientWidth;
        const height = container.node().clientHeight;
        
        this.boundaryColor = '#bbb';

        // we use Mercator projection
        const projection = this.projection = d3.geoMercator()
            .scale(width / 2 / Math.PI)
            .translate([width / 2, height *0.7]);

        // create the SVG element
        this.svg = container.append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("class", "map");
    
        // geopath transforms GeoJson feature into SVG path 
        this.geopath = d3.geoPath().projection(projection);

        // create the tooltip
        this.createTooltip();

        //createLegend();


        this.colorScale = options.colorScale || d3.scaleLinear().range(["#eee", "#2e4"]);
        this.processData(options.data)

        // fetch the map
        const worldMapUrl = "geo_un_simple_boundaries.geojson";
        const me = this;
        fetch(worldMapUrl)
            .then(d=>d.json())
            .then(d=>me.worldMap = d)
            .then(d=>me.buildMap(d));
        
    }

    processData(series) {
        const valueTable = this.valueTable = {}
        series.forEach(item => valueTable[item[0]] = item[1]);
        this.valueRange = d3.extent(series.map(v=>v[1]));
        this.colorScale.domain(this.valueRange);
    }


    // return a color for a given country code
    getValueColor(countryCode) {
        let v = this.valueTable[countryCode]
        if(v === undefined) return '#eee';
        else return this.colorScale(v);
    }


    buildMap() {
        let g = this.svg.append("g");

        // add countries
        const me = this;
        let paths = g.selectAll("path")
            .data(this.worldMap.features.filter(f=>f.properties.ISO3CD != "ATA"))
            .enter()
            .append("path")
            .attr("d", me.geopath)
            .style('fill', d => me.getValueColor(d.properties.ISO3CD))
            .style('stroke', me.boundaryColor);


        // handle tooltip
        paths
            .on("mouseover", function(d) {
                this.parentNode.appendChild(this);
                d3.select(this).style('stroke', 'black');
                me.showTooltip(d.properties.ISO3CD, d.properties.MAPLAB);
            })
            .on("mousemove", function(d) {
                me.showTooltip(d.properties.ISO3CD, d.properties.ROMNAM)
            })
            .on("mouseout", function(d) {
                d3.select(this).style('stroke', me.boundaryColor);
                me.hideToolTip();
            });
    }


    
    // create a tooltip (see .css file for look&feel)
    createTooltip() {
        this.tooltip = d3.select("body")
            .append("div")
            .attr("class", "nicemap-tooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden");
        this.tooltip
            .append("div").attr("class", "tooltip-text")
    }


    // visualize & hide the tooltip
    showTooltip(countryCode, countryName) {
    
        let content = "<strong>" + countryName + "</strong>" + 
            "<br>Value = " + this.valueTable[countryCode];
            
        this.tooltip
            .style("visibility", "visible")
            .style("top", (d3.event.pageY+10)+"px") 
            .style("left",(d3.event.pageX+10)+"px")

        this.tooltip.select(".tooltip-text")
            .html(content)
    }

    hideToolTip() {
        this.tooltip.style("visibility", "hidden")
    }

}




window.onload = function() {
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
