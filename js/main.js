var pageHeight = $(window).height();
$("#loader").css("height", pageHeight * 0.75 );

// comma seperator for thousands
var formatCommas = d3.format(",");

// setup Leaflet map
var logoBarHeight = $("#logo-bar").height()
var mapHeight = $(window).height() - logoBarHeight;

$("#map-container").height(mapHeight);

var mapboxAttribution = '<a href="https://www.mapbox.com/" target="_blank">Mapbox</a> | Base data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | &copy; <a href="https://ifrc.org/" title="IFRC" target="_blank">IFRC</a> 2014 | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';
var hotAttribution = 'Base data &copy; <a href="http://openstreetmap.org" target="_blank">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/" target="_blank">CC-BY-SA</a> | Map style by <a href="http://hot.openstreetmap.org" target="_blank">H.O.T.</a> | &copy; <a href="https://ifrc.org/" title="IFRC" target="_blank">IFRC</a> 2014 | <a title="Disclaimer" onClick="showDisclaimer();">Disclaimer</a>';

var mapboxStreetsUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.hmki3gmj/{z}/{x}/{y}.png',
  mapboxTerrainUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.hc5olfpa/{z}/{x}/{y}.png',
  greyscaleUrl = 'http://{s}.tiles.mapbox.com/v3/americanredcross.i4d2d077/{z}/{x}/{y}.png',
  hotUrl = 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
var mapboxStreets = new L.TileLayer(mapboxStreetsUrl, {attribution: mapboxAttribution}),
  mapboxTerrain = new L.TileLayer(mapboxTerrainUrl, {attribution: mapboxAttribution}),
  greyscale = new L.TileLayer(greyscaleUrl, {attribution: mapboxAttribution}),
  hot = new L.TileLayer(hotUrl, {attribution: hotAttribution});

var healthFacilitiesData = [];
var chaptersData = {};
var supplyChainData = {};
var healthFacilities = new L.FeatureGroup();
var chapters = new L.FeatureGroup();
var supplyChain = new L.FeatureGroup();
var extentGroup = new L.FeatureGroup();



var map = new L.Map("map", {
  center: [11.04197, 124.96296], 
  zoom: 8, 
  minZoom: 6,
  layers: [hot]
});

var baseMaps = {
  "Grey": greyscale,
  "Streets": mapboxStreets,
  "Terrain": mapboxTerrain,
  "HOT": hot
};
var overlayMaps = {
    "Red Cross Chapters": chapters,
    "Supply Chain": supplyChain
};

var hospitalMarkerOptions = {
    radius: 7,
    fillColor: "#662506",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};
var rhuMarkerOptions = {
    radius: 4,
    fillColor: "#cc4c02",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};
var chapterMarkerOptions = {
    radius: 6,
    fillColor: "#ff0000",
    color: "#670000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};
var portMarkerOptions = {
    radius: 5,
    fillColor: "#253494",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};
var airportMarkerOptions = {
    radius: 5,
    fillColor: "#ffff99",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};
var warehouseMarkerOptions = {
    radius: 5,
    fillColor: "#7fc97f",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.9
};

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend');
  div.innerHTML = '<b style="font-size:125%; text-decoration:underline;">Haiyan Health Facility Recovery</b><br>' +
    '<span id="facilityNumber">0</span> facilities displayed<br>'+
    'Facility Type:<br>'+'<i class="HealthFacilities" style="background:' + hospitalMarkerOptions["fillColor"] + '"></i>' + '<span class="HealthFacilities">DOH Hospital<br></span>' + '' +
    '<i class="HealthFacilities" style="background:' + rhuMarkerOptions["fillColor"] + '"></i><span class="HealthFacilities">Health Facility<br></span>' +
      'Item Need (on marker click):<br>' +
      '<small><i class="popup-legend-box Requiredasperoriginallist"></i> Required (original list)<br> ' +
      '<i class="popup-legend-box DOHrevision"></i> DOH revision<br> ' +
      '<i class="popup-legend-box Proposedneeds"></i> Proposed needs<br> ' +
      '<i class="popup-legend-box Notrequired"></i> Not required</small><hr class="legend-hr"> ' +
    '<i class="RedCrossChapters" style="display:none; background:' + chapterMarkerOptions["fillColor"] + '"></i><span class="RedCrossChapters" style="display:none;">Red Cross Chapter<br><small>&nbsp;&nbsp;&nbsp;&nbsp; * involved in project</small><br></span>'+
    '<i class="SupplyChain" style="display:none; background:' + warehouseMarkerOptions["fillColor"] + '"></i><span class="SupplyChain" style="display:none;">Red Cross Warehouse<br></span>'+
    '<i class="SupplyChain" style="display:none; background:' + portMarkerOptions["fillColor"] + '"></i><span class="SupplyChain" style="display:none;">Port<br></span>'+
    '<i class="SupplyChain" style="display:none; background:' + airportMarkerOptions["fillColor"] + '"></i><span class="SupplyChain" style="display:none;">Airport<br></span>';
    return div;
};

    ;

legend.addTo(map);

map.on('overlayadd', function(e){
  var overlay = e.name.replace(/\s+/g, '');
  var legendClass = "." + overlay;
  $(legendClass).toggle();
});
map.on('overlayremove', function(e){
  var overlay = e.name.replace(/\s+/g, '');
  var legendClass = "." + overlay;
  $(legendClass).toggle();
});



L.control.layers(baseMaps, overlayMaps).addTo(map);


function getFacilityData() {
  d3.csv("data/facilities_new.csv", function(data){ 
    formatData(data); 
  });
}

// format CSV data as geoJson
function formatData(data){
    $.each(data, function(index, item) {
        var latlng = [item.lon, item.lat];
        var thisGeoJsonObject = {
            "type": "Feature",
            "properties": {
                "name": item.name,
                "municip": item.municipali,
                "province": item.Province,
                "RHU / Hospital": item["RHU / Hospital"],

                "items": {    
                  "Ultrasound machine": {
                    "count": item["Ultrasound machine"],
                    "note": item["Ultrasound machine NOTE"]
                  },
                  "Anesthesia machine": {
                    "count": item["Anesthesia machine"],
                    "note": item["Anesthesia machine NOTE"]
                  }, 
                  "Ventilator (portable)": {
                    "count": item["Ventilator (portable)"], 
                    "note": item["Ventilator (portable) NOTE"]
                  }, 
                  "Respirator (portable)": {
                    "count": item["Respirator (portable)"], 
                    "note": item["Respirator (portable) NOTE"]
                  },
                  "ECG machine": { 
                    "count": item["ECG machine"], 
                    "note": item["ECG machine NOTE"]
                  },  
                  "Generator 6KVA": { 
                    "count": item["Generator 6KVA"],  
                    "note": item["Generator 6KVA NOTE"]
                  }, 
                  "Std Eqpt for RHU": { 
                    "count": item["Std Eqpt for RHU"],  
                    "note": item["Std Eqpt for RHU NOTE"]
                  }, 
                  "OB/Del kits": { 
                    "count": item["OB/Del kits"], 
                    "note": item["OB/Del kits NOTE"]
                  },  
                  "First Aid kits": { 
                    "count": item["First Aid kits"], 
                    "note": item["First Aid kits NOTE"]
                  }
                }                              
            },
            "geometry": {
                "type": "Point",
                "coordinates": latlng
            }
        };
        healthFacilitiesData.push(thisGeoJsonObject);
    });
    getChaptersData();
}


function getChaptersData() {
  $.ajax({
    type: 'GET',
    url: 'data/chapters.geojson',
    contentType: 'application/json',
    dataType: 'json',
    timeout: 10000,
    success: function(data) {
      chaptersData = data;
      getSupplyChainData();

    },
    error: function(e) {
      console.log(e);
    }
  });
}

function getSupplyChainData() {
  $.ajax({
    type: 'GET',
    url: 'data/supplyChain.geojson',
    contentType: 'application/json',
    dataType: 'json',
    timeout: 10000,
    success: function(data) {
      supplyChainData = data;
      mapData();

    },
    error: function(e) {
      console.log(e);
    }
  });
}

function mapData() {
  // Health facilities
  $("#facilityNumber").html(healthFacilitiesData.length.toString());
  L.geoJson(healthFacilitiesData, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng)
    },
    style: function(feature){
        switch (feature.properties["RHU / Hospital"]){
          case 'Hospital': return hospitalMarkerOptions;
          case 'RHU': return rhuMarkerOptions;
        }
    },
    onEachFeature: onEachHealthFacility
  }).addTo(healthFacilities).addTo(extentGroup);
  // Chapters
  L.geoJson(chaptersData.features, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng, chapterMarkerOptions)
    },
    onEachFeature: onEachChapter
  }).addTo(chapters).addTo(extentGroup);
  map.addLayer(healthFacilities);
  map.addLayer(chapters);
  zoomOut();
  // Supply chain
  L.geoJson(supplyChainData.features, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng)
    },
    style: function(feature){
        switch (feature.properties.type){
          case 'airport': return airportMarkerOptions;
          case 'port': return portMarkerOptions;
          case 'warehouse': return warehouseMarkerOptions;
        }
    },
    onEachFeature: onEachSupply
  }).addTo(supplyChain).addTo(extentGroup);
  $("#loader").remove();
}

function filterMap(filterType, filter) {
  if(filterType === "item"){
    $("#item-filter-label").html(filter);
  }
  if(filterType === "type"){
    $("#type-filter-label").html(filter);
  }
  var itemFilter = $("#item-filter-label").html();
  var typeFilter = $("#type-filter-label").html();
  
  var displayedFacilities = [];

  $.each(healthFacilitiesData, function(index, facility){
    var itemObject = facility.properties["items"][itemFilter]
    if(typeFilter === 'All' || typeFilter === facility.properties["RHU / Hospital"]){
      if(itemFilter === 'All' || parseInt(itemObject.count) > 0){
        displayedFacilities.push(facility);
      }
    }
  $("#facilityNumber").html(displayedFacilities.length.toString());
  });
  // Health facilities
  map.removeLayer(healthFacilities);
  healthFacilities = L.featureGroup();
  L.geoJson(displayedFacilities, {
    pointToLayer: function (feature, latlng){
      return L.circleMarker(latlng)
    },
    style: function(feature){
        switch (feature.properties["RHU / Hospital"]){
          case 'Hospital': return hospitalMarkerOptions;
          case 'RHU': return rhuMarkerOptions;
        }
    },
    onEachFeature: onEachHealthFacility
  }).addTo(healthFacilities);
  map.addLayer(healthFacilities);
  map.fitBounds(healthFacilities.getBounds().pad(0.1,0.1));

}

function onEachHealthFacility(feature, layer) {
  var popupHtml = "<h3>" + feature.properties.name + ' <br><small>'+ feature.properties.municip +
    ", " + feature.properties.province + '</small></h3><div class="popup-text">';
  var sumCosts = 0;
  $.each(feature.properties.items, function(index, item){
    if(parseInt(item.count)>=0){
      popupHtml += '<span class="item-header ' + item.note.replace(/\s+/g, '') + '">' + 
      item.count + " x " + index + '</span><br>'; 
    }
  });

  layer.bindPopup(popupHtml);

  layer.on({
    mouseover: facilityMousover,
    mouseout: facilityMouseout
  });
}

function facilityMousover(e){
  var tooltipText = e.target.feature.properties.name;
  $('#tooltip').append(tooltipText); 
}

function facilityMouseout(e){
  $('#tooltip').empty(); 
}

function onEachChapter(feature, layer) {
  layer.bindPopup(feature.properties.name);
}
function onEachSupply(feature, layer) {
  layer.bindPopup(feature.properties.name);
}

// VARIOUS HELPER FUNCTIONS

function zoomOut(){  
  map.fitBounds(extentGroup.getBounds().pad(0.1,0.1));

} 

// adjust map div height on screen resize
$(window).resize(function(){
  logoBarHeight = $("#logo-bar").height()
  mapHeight = $(window).height() - logoBarHeight;
  $("#map-container").height(mapHeight);
});

// show disclaimer text on click of dislcaimer link
function showDisclaimer() {
    window.alert("The maps used do not imply the expression of any opinion on the part of the International Federation of Red Cross and Red Crescent Societies or National Societies concerning the legal status of a territory or of its authorities.");
}

// tooltip follows cursor
$(document).ready(function() {
    $('#map').mouseover(function(e) {        
        //Set the X and Y axis of the tooltip
        $('#tooltip').css('top', e.pageY + 10 );
        $('#tooltip').css('left', e.pageX + 20 );         
    }).mousemove(function(e) {    
        //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
        $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});        
    });
});

getFacilityData();