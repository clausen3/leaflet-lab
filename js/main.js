//lab 1



//function to instantiate the map
function createMap(){
//the view of the map upon start
var map = L.map('mapid', {
  center: [0, 0],
  zoom: 3,
});

//adds tilelayers from OSM
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

getData(map);

};

//This function returns the radius for a proportional symbol based on the
//appropriate attribute value
function calcPropRadius(attValue) {
    //scale factor to adjust symbol size evenly
    var scaleFactor = 50;
    //area based on attribute value and scale factor
    var area = attValue * scaleFactor;
    //radius calculated based on area
    var radius = Math.sqrt(area/Math.PI);

    return radius;
};

//This function creates proportional symbols based on the values within
//the attribute variable
function createPropSymbols(data, map){
    //create marker options
    var attribute = "Rainfall_Mar";
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //Leaflet GeoJSON layer and added it to the map
    L.geoJson(data, {
        pointToLayer: function (feature, latlng) {
            //Step 5: For each feature, determine its value for the selected attribute
            var attValue = Number(feature.properties[attribute]);

            //Step 6: Give each feature's circle marker a radius based on its attribute value
            geojsonMarkerOptions.radius = calcPropRadius(attValue);

            //create circle markers
            return L.circleMarker(latlng, geojsonMarkerOptions);
        }
    }).addTo(map);
};






//Imports Geojson data and loads it
function getData(map){
  $.ajax("data/AverageRainfall.geojson", {
    dataType: "json",
    success: function (response){
      createPropSymbols(response, map); //Prop symbols call
    }
  });
};




$(document).ready(createMap);
