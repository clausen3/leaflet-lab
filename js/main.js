//lab 1 Jacob clausen
//leaflet-search plugin used from https://github.com/stefanocudini/leaflet-search




//function to instantiate the map
function createMap(){
//the view of the map upon start
var map = L.map('mapid', {
  center: [15,5],
  zoom: 1.5,
});


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
    var scaleFactor = 100;
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
        fillColor: "#3232ff",
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
    popupContent += "<p><b>Precipitation in " + year + ":</b> " + feature.properties[attribute] + " Inches</p>";
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


//Sequence controls for user to sequence through different months one at a time
function createSequenceControls(map, attributes){

  var SequenceControl = L.Control.extend({
      options: {
          position: 'bottomleft'
      },

      onAdd: function (map) {
          // creates the control container div with a particular class name
          var container = L.DomUtil.create('div', 'sequence-control-container');
          //creates slider
          $(container).append('<input class="range-slider" type="range">');
          //add skip buttons
          $(container).append('<button class="skip" id="reverse" title="Reverse">Reverse</button>');
          $(container).append('<button class="skip" id="forward" title="Forward">Skip</button>');

          //kill any mouse event listeners on the map
          $(container).on('mousedown dblclick', function(e){
              L.DomEvent.stopPropagation(e);
          });

          return container;
        }
    });
    map.addControl(new SequenceControl());

    //Input range of slider
    //slider attributes
$('.range-slider').attr({
    max: 11,
    min: 0,
    value: 0,
    step: 1
});
//Click listener for buttons
$('.skip').click(function(){
    //get the old index value
    var index = $('.range-slider').val();

    //increment or decrement depending on button clicked
    if ($(this).attr('id') == 'forward'){
        index++;
        //if past the last attribute, wrap around to first attribute
        index = index > 11 ? 0 : index;
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
          popupContent += "<p><b>Precipitation " + year + ":</b> " + props[attribute] + " Inches</p>";

          //replace the layer popup
          layer.bindPopup(popupContent, {
              offset: new L.Point(0,-radius)
          });
      };
    });
    updateLegend(map, attribute);

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


//This function returns an array of attribute names with rainfall values
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with rainfall values
        if (attribute.indexOf("Prec") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};



//This function creates a legend containing SVG graphics to represent
//proportional symbols and calls updateLegend(); to display the approporiate
//month and text
function createLegend(map, attributes){

  var LegendControl = L.Control.extend({
    options:{
      position: 'bottomright'
    },

    onAdd: function (map){
      //creates the control container and adds the temporal legend to the div
      var container = L.DomUtil.create('div', 'legend-control-container');
      $(container).append('<div id="temporal-legend">')
      //attribute legend svg string
      var svg = '<svg id="attribute-legend" width="350px" height="250px">';

      var circles = {
        max: 20,
        mean: 40,
        min: 60
      };

      //adds each circle and text to svg string
      for (var circle in circles){
                  //circle string
                  svg += '<circle class="legend-circle" id="' + circle + '" fill="#3232ff" fill-opacity=".8" stroke="#000000" cx="30"/>';
                  //text string
                  svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';
              };
              svg += "</svg>";

      $(container).append(svg);
      return container;

    }
    });
    map.addControl(new LegendControl());
    updateLegend(map, attributes[0]);
};


//This function dynamically updates the appropriate month text based on
//the appropriate attribute
function updateLegend(map, attribute){

      $('.legend-control-container').append('<div id="temporal-legend">')
      // console.log(attribute)
      var year = attribute.split("_")[1];
      var content = "Precipitation In "+ year;
      console.log(year);
      $('#temporal-legend').html(content);

      var circleValues = getCircleValues(map, attribute);

   for (var key in circleValues){
       //get the radius
       var radius = calcPropRadius(circleValues[key]);

       //assigns the cy and r attributes
       $('#'+key).attr({
           cy: 59 - radius,
           r: radius
       });

       //add legend text
       $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " Inches");

   };
};



//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};


//Imports GeoJSON data and calls functions after this is finished
function getData(map, attributes){
  $.ajax("data/PrecipData.geojson", {
      dataType: "json",
      success: function(response){
          //create an attributes array
          var attributes = processData(response);

          createPropSymbols(response, map, attributes);
          createSequenceControls(map, attributes);
          createLegend(map, attributes);
      }

  });
};


$(document).ready(createMap);
