//lab 1 Jacob clausen

//leaflet-search plugin used from https://github.com/stefanocudini/leaflet-search



//function to instantiate the map
function createMap(){
//the view of the map upon start
var map = L.map('mapid', {
  center: [70,-20],
  zoom: 2,
});



//var geocoder = L.Mapzen.geocoder('mapzen-dH6CaUV');
//geocoder.addTo(map);



//adds tilelayers from mapbox
L.tileLayer('https://api.mapbox.com/styles/v1/clausen3/ciz4z7jvy00602rqbu1wefpt6/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiY2xhdXNlbjMiLCJhIjoiY2l6NHlyYmRlMDVtOTJ5bjh5ZWUwYm1zciJ9.-gVypoiuj7bIOTtdnn4uaw', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
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



//function to convert markers to circle markers for each feature and each
//circle marker will have a popup on click displaying the city name
//and rainfall amount for the current month
function pointToLayer(feature, latlng, attributes){
    //Step 4: Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    console.log(attribute);
    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>";
    //add formatted attribute to popup content string
var year = attribute.split("_")[1];
popupContent += "<p><b>Rain fall in " + year + ":</b> " + feature.properties[attribute] + " Inches</p>";
    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};



//This function creates a search box that will allow the user to type
//in a city name that is located on the map. The map will then highlight
//that city, pan to it, and the popup will open
//from: http://labs.easyblog.it/maps/leaflet-search/examples/geojson-layer.html
function searchBar (map, data, featuresLayer, attributes) {

  var cityName;
  for (var attribute in data.features[0].properties){
      //only take attributes with values
      if (attribute == "City") {
          cityName = attribute;
      };
  }

  var searchControl = new L.Control.Search({

    layer: featuresLayer,
    propertyName: cityName,
    marker: false,
    moveToLocation: function (latlng, title, map) {
      			//var zoom = map.getBoundsZoom(latlng.layer.getBounds());
      map.setView(latlng); //took out "zoom" from map.setView(latlng, zoom)
    }
  });

//if location is found, it will be highlighted and the popup will open
  searchControl.on('search:locationfound', function(e) {

  		e.layer.setStyle({fillColor: '#3f0', color: '#0f0'});
  		if(e.layer._popup)
  			e.layer.openPopup();

  	}).on('search:collapsed', function(e) {

  		featuresLayer.eachLayer(function(layer) {	//restore feature color
  			featuresLayer.resetStyle(layer);
  		});
  	});

  map.addControl(searchControl);

};








//Sequence controls
function createSequenceControls(map, attributes){
    //Input range of slider
    $('#panel').append('<input class="range-slider" type="range">');
    //slider attributes
$('.range-slider').attr({
    max: 6,
    min: 0,
    value: 0,
    step: 1
});

$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
$('#panel').append('<button class="skip" id="forward">Skip</button>');

//Click listener for buttons
$('.skip').click(function(){
    //get the old index value
    var index = $('.range-slider').val();

    //increment or decrement depending on button clicked
    if ($(this).attr('id') == 'forward'){
        index++;
        //if past the last attribute, wrap around to first attribute
        index = index > 6 ? 0 : index;
    } else if ($(this).attr('id') == 'reverse'){
        index--;
        //if past the first attribute, wrap around to last attribute
        index = index < 0 ? 6 : index;
    };

    //update slider and symbols based on index
    $('.range-slider').val(index);

    updatePropSymbols(map, attributes[index]);

});

//input listener for slider
$('.range-slider').on('input', function(){
    //sequence
            var index = $(this).val();
            updatePropSymbols(map, attributes[index]);

});
};


//this function accesses all the leaflet layers on the map and selects
//the L.circlemarkers layer and will update each radius and replace the popup
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
      if (layer.feature && layer.feature.properties[attribute]){
          //access feature properties
          var props = layer.feature.properties;

          //update each feature's radius based on new attribute values
          var radius = calcPropRadius(props[attribute]);
          layer.setRadius(radius);

          //add city to popup content string
          var popupContent = "<p><b>City:</b> " + props.City + "</p>";

          //add formatted attribute to panel content string
          var year = attribute.split("_")[1];
          popupContent += "<p><b>Rainfall " + year + ":</b> " + props[attribute] + " Inches</p>";

          //replace the layer popup
          layer.bindPopup(popupContent, {
              offset: new L.Point(0,-radius)
          });
      };
    });
};

//This function creates proportional symbols based on the values within
//the attribute values gotten from the pointToLayer function
function createPropSymbols(data, map, attributes){
    //Leaflet GeoJSON layer and adds it to the map
  var theLayer = L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);

    //Search box created when the symbols are
 searchBar(map, data, theLayer, attributes);
};


//this function returns an array of attribute names with rainfall values
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with rainfall values
        if (attribute.indexOf("Rainfall") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};


//Imports GeoJSON data and calls functions after this is finished
function getData(map, attributes){
  $.ajax("data/AverageRainfall.geojson", {
      dataType: "json",
      success: function(response){
          //create an attributes array
          var attributes = processData(response);

          createPropSymbols(response, map, attributes);
          createSequenceControls(map, attributes);

      }

  });
};


$(document).ready(createMap);
