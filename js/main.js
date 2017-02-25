//lab 1



//function to instantiate the map
function createMap(){
//the view of the map upon start
var map = L.map('mapid', {
  center: [70,-20],
  zoom: 2,
});

//adds tilelayers from OSM
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






//function to convert markers to circle markers
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
popupContent += "<p><b>Rain fall in " + year + ":</b> " + feature.properties[attribute] + " Centimeters</p>";
    //bind the popup to the circle marker
    layer.bindPopup(popupContent);

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};







//This function creates proportional symbols based on the values within
//the attribute variable
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
};




//Step 1: Create new sequence controls
function createSequenceControls(map, attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');
    //set slider attributes
$('.range-slider').attr({
    max: 6,
    min: 0,
    value: 0,
    step: 1
});
$('#panel').append('<button class="skip" id="reverse">Reverse</button>');
$('#panel').append('<button class="skip" id="forward">Skip</button>');
//Step 5: click listener for buttons
//Example 3.12 line 2...Step 5: click listener for buttons
$('.skip').click(function(){
    //get the old index value
    var index = $('.range-slider').val();

    //Step 6: increment or decrement depending on button clicked
    if ($(this).attr('id') == 'forward'){
        index++;
        //Step 7: if past the last attribute, wrap around to first attribute
        index = index > 6 ? 0 : index;
    } else if ($(this).attr('id') == 'reverse'){
        index--;
        //Step 7: if past the first attribute, wrap around to last attribute
        index = index < 0 ? 6 : index;
    };

    //Step 8: update slider
    $('.range-slider').val(index);
    console.log(index);
    updatePropSymbols(map, attributes[index]);
});

//Step 5: input listener for slider
$('.range-slider').on('input', function(){
    //sequence
            var index = $(this).val();
            console.log(index);
            updatePropSymbols(map, attributes[index]);
});
};



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
          popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + " million</p>";

          //replace the layer popup
          layer.bindPopup(popupContent, {
              offset: new L.Point(0,-radius)
          });
      };
    });
};





function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Rainfall") > -1){
            attributes.push(attribute);
        };
    };

    //check result
    console.log(attributes);

    return attributes;
};


//Import GeoJSON data
function getData(map){
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
