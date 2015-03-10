function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var debug = true;
var map = null;
var markers = [];
var line_markers = [];

var animation_timeout = null;
var info_windows = {};

var sites = {
  1: {
    "name": "Palm Jebel Ali",
    "lat": 25.005372,
    "lng": 54.988471
  },
  2: {
    "name": "Palm Jumeriah",
    "lat": 25.119483,
    "lng": 55.131273
  },
  3: {
    "name": "Airport",
    "lat": 25.256608,
    "lng": 55.357995
  },
  4: {
    "name": "Jebel Ali",
    "lat": 24.958366,
    "lng": 55.099356
  },
  5: {
    "name": "Business Bay",
    "lat": 25.186466,
    "lng": 55.265018
  }
}

var node_values_now = {
  1: {
    "tch_drop_rate": getRandomInt(1, 20) / 10,
    "tch_available": getRandomInt(15, 100)
  },
  2: {
    "tch_drop_rate": getRandomInt(1, 20) / 10,
    "tch_available": getRandomInt(15, 100)
  },
  3: {
    "tch_drop_rate": getRandomInt(1, 20) / 10,
    "tch_available": getRandomInt(15, 100)
  },
  4: {
    "tch_drop_rate": getRandomInt(1, 20) / 10,
    "tch_available": getRandomInt(15, 100)
  },
  5: {
    "tch_drop_rate": getRandomInt(1, 20) / 10,
    "tch_available": getRandomInt(15, 100)
  },
}

var site_to_site = {};

for (var site_from in sites) {
  if (typeof sites[site_from] !== 'function') {
    for (var site_to in sites) {
      if (typeof sites[site_to] !== 'function') {
        if (site_from == site_to || site_to < site_from) {
          continue;
        }
        var latency_list = [];
        for (var i = 0; i < 4 * 24; i++) {
          latency_list.push(getRandomInt(0, 150));
        }
        var link = {
          "site_from": site_from,
          "site_to": site_to,
          "latency": getRandomInt(0, 150),
          "latencies": latency_list
        };
        site_to_site[site_from + "-" + site_to] = link;
      }
    }
  }
}

if (debug) {
  console.log(site_to_site);
}

function open_info_window_line(site_from, site_to, map, line, lat, lng) {
  var line_key = site_from + "-" + site_to;
  var step_value = get_step_value();
  var latency = site_to_site[line_key]["latencies"][get_step_value()];
  var contentString = '<div id="content">' +
    '<div id="link-' + line_key + '">' +
    '<p>Latency: ' + latency + '</p>' +
    '</div>';

  if (line_key in info_windows) {
    if (info_windows[line_key]) {
      info_windows[line_key].close();
    }
  }

  var infowindow = new google.maps.InfoWindow({
    content: contentString,
    maxWidth: 200,
    //position: new google.maps.LatLng(latlng.k, latlng.D)
    position: new google.maps.LatLng(lat, lng)
  });
  infowindow.open(map);
  info_windows[line_key] = infowindow;
}

function open_info_window_site(site_id, map, marker) {
  var contentString = '<div id="content">' +
    '<div id="siteNotice">' +
    '</div>' +
    '<h1 id="firstHeading" class="firstHeading">' + sites[site_id]["name"] + '</h1>' +
    '<p>Site Metrics at timestamp</p>' +
    '<div id="bodyContent">' +
    '<p>tch_drop_rate: ' + node_values_now[site_id]["tch_drop_rate"] + '</p>' +
    '<p>tch_available: ' + node_values_now[site_id]["tch_available"] + '</p>' +
    '</div>' +
    '</div>';
  var infowindow = new google.maps.InfoWindow({
    content: contentString,
    maxWidth: 200
  });
  infowindow.open(map, marker);
}

function draw_lines() {
  var step_value = get_step_value();
  console.log("Drawing Lines", step_value);
  for (var line_key in site_to_site) {
    if (typeof site_to_site[line_key] !== 'function') {
      var node_from_id = parseInt(line_key.split("-")[0]);
      var node_to_id = parseInt(line_key.split("-")[1]);
      var lineCoordinates = [new google.maps.LatLng(sites[node_from_id]["lat"], sites[node_from_id]["lng"]),
        new google.maps.LatLng(sites[node_to_id]["lat"], sites[node_to_id]["lng"])
      ];
      var line_color = null;
      var latency = site_to_site[line_key]["latencies"][get_step_value()];

      //If Open Dialog Div then Update the Text Contained therein
      if (document.getElementById('link-' + line_key) === null) {
        //pass
      } else {
        document.getElementById('link-' + line_key).innerHTML = '<p>Latency: ' + latency + '</p>';
      }

      if (latency < 50) {
        //Green
        line_color = "#008000";
      }
      if (latency < 80) {
        //Yellow
        line_color = "#FFFF00";
      } else if (latency < 110) {
        //Orange
        line_color = "#FFA500";
      } else {
        //Red
        line_color = "#FF0000";
      }

      function getBoxSymbol(index, color, size) {
        var x_start = - size/2;
        y_start = x_start + (index * size);

        return {
              path: 'M' + x_start + ' ' + y_start + ' h ' + size + ' v ' + size + ' h -' + size + ' Z',
              fillColor: color,
              fillOpacity: 1.0,
              strokeWeight: 0
            };
      }

      function getLetterSymbol(letter, index, color, size, padding) {
        if (letter == 'E') {
          var x_start = - size/2 + 1;
          y_start = (index * size) - 2;

          size -= padding;
          var halfSize = size / 2;
          var halfPadding = padding / 2;

          return {
                path: 'M' + (x_start+size-halfPadding) + ',' + y_start + ' l-' + (size-halfPadding) + ',0 l0,' + halfSize + ' l' + halfSize + ',0 m-' + halfSize + ',0 l0,' + halfSize + ' l' + (size-halfPadding) + ',0',
                strokeColor: color,
                strokeWeight: 2
              };
        }
        else if (letter == 'H') {
          var x_start = - size/2 + 1;
          y_start = (index * size) - 2;

          size -= padding;
          var halfSize = size / 2;
          var halfPadding = padding / 2;

          return {
                path: 'M' + (x_start+halfPadding) + ',' + y_start + ' l0,' + size + ' l0,-' + halfSize + ' l' + (halfSize) + ',0 m0,-' + halfSize + ' l0,' + size,
                strokeColor: color,
                strokeWeight: 2
              };
        }
        else if (letter == 'F') {
          var x_start = - size/2 + 1;
          y_start = (index * size) - 2;

          size -= padding;
          var halfSize = size / 2;
          var halfPadding = padding / 2;

          return {
                path: 'M' + (x_start+size-halfPadding) + ',' + y_start + ' l-' + (size-halfPadding) + ',0 l0,' + halfSize + ' l' + halfSize + ',0 m-' + halfSize + ',0 l0,' + halfSize,
                strokeColor: color,
                strokeWeight: 2
              };
        }
        else if (letter == 'M') {
          var x_start = - size/2 + 1;
          y_start = (index * size) - 2;

          size -= padding;
          var halfSize = size / 2;
          var halfPadding = padding / 2;

          return {
                path: 'M' + x_start + ',' + (y_start+size) + ' l0,-' + size + ' l' + halfSize +',' + (size-halfPadding) + ' l' + halfSize + ',-' + (size-halfPadding) + ' l0,' + size,
                strokeColor: color,
                strokeWeight: 2
              };
        }
      }

      var symbolSize = 6;
      var symbolPadding = 2;

      var line = new google.maps.Polyline({
        path: lineCoordinates,
        geodesic: true,
        strokeColor: line_color,
        strokeOpacity: 0.75,
        strokeWeight: 2,
        id: line_key,
        icons: [{
            icon: getBoxSymbol(-1, '#006cff', symbolSize),
            offset: '50%'
          }, {
            icon: getBoxSymbol(0, '#ff7e00', symbolSize),
            offset: '50%'
          }, {
            icon: getBoxSymbol(1, '#00ff72', symbolSize),
            offset: '50%'
          }, {
            icon: getLetterSymbol(getRandomInt(0, 1)? "E" : "H", -1, '#fff', symbolSize, symbolPadding),
            offset: '50%'
          }, {
            icon: getLetterSymbol(getRandomInt(0, 1)? "M" : "F", 0, '#fff', symbolSize, symbolPadding),
            offset: '50%'
          }
          // , {
          //   icon: getLetterSymbol('F', 1, '#333', symbolSize, symbolPadding),
          //   offset: '50%'
          // },
        ],
      });
      line.setMap(map);
      google.maps.event.addListener(line, 'click', function(event) {
        //console.log(this);
        //console.log(event.latLng.k, event.latLng.D);
        var node_from_id = parseInt(this.id.split("-")[0]);
        var node_to_id = parseInt(this.id.split("-")[1]);
        var latlng = event.latlng;

        open_info_window_line(node_from_id, node_to_id, map, this, event.latLng.k, event.latLng.D);
      });

      google.maps.event.addListener(line, 'mouseover', function(event) {
        this.setOptions({
          strokeWeight: 3.6,
          strokeOpacity: 1
        });
      });

      google.maps.event.addListener(line, 'mouseout', function(event) {
        this.setOptions({
          strokeWeight: 2.0,
          strokeOpacity: 0.75
        });
      });

      line_markers.push(line);
    }
  }
}

function draw_markers() {
  console.log("Drawing Markers");
  for (var site_from in sites) {
    if (typeof sites[site_from] !== 'function') {
      var site_lat_long = new google.maps.LatLng(sites[site_from]["lat"], sites[site_from]["lng"]);
      var marker = new google.maps.Marker({
        position: site_lat_long,
        map: map,
        title: sites[site_from]["name"],
        id: site_from
      });
      markers.push(marker);
      google.maps.event.addListener(marker, 'click', function() {
        console.log(this);
        open_info_window_site(parseInt(this.id), map, this);
      });
    }
  }
}

function historySlider(controlDiv, map) {

  // Set CSS for the control border
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = '#fff';
  controlUI.style.border = '2px solid #fff';
  controlUI.style.borderRadius = '3px';
  controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
  controlUI.style.cursor = 'pointer';
  controlUI.style.marginBottom = '22px';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to recenter the map';
  controlDiv.appendChild(controlUI);

  // Set CSS for the control interior
  var controlText = document.createElement('div');
  controlText.style.color = 'rgb(25,25,25)';
  controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
  controlText.style.fontSize = '16px';
  controlText.style.lineHeight = '15px';
  controlText.style.paddingLeft = '5px';
  controlText.style.paddingRight = '5px';
  controlText.innerHTML = '' +
    '<div id="datetime_text">12th March 2014 12:00</div><br/>' +
    '<input id="datetime_slider" type="range" onmouseup="history_value_update()" onmousedown="pause_timeline(false)">' +
    '<br/>' +
    '<img width="20px" height="20px" src="./images/play24x24.png" onclick="animate_timeline()"/>' +
    '<img width="20px" height="20px" src="./images/pause24x24.png" onclick="pause_timeline(false)"/>' +
    '<img width="20px" height="20px" src="./images/stop24x24.png" onclick="pause_timeline(true)"/>' +
    '';
  controlUI.appendChild(controlText);
}

function get_step_value() {
  var value = null;
  try {
    value = document.getElementById('datetime_slider').value;
  } catch (err) {
    //Maybe DOM has not loaded yet
    value = 50;
  }
  var total_intervals = 4 * 24;
  var step_size = total_intervals / 100;
  var steps = Math.floor(value * step_size);
  if (steps == total_intervals) {
    steps = steps - 1;
  }
  return steps;
}



function clear_lines() {

  for (var i = 0; i < line_markers.length; i++) {
    var line = line_markers[i];
    line.setMap(null);
    //console.log(line);
    //Memory Leak?
  }
  //line_markers.length = 0;
}

function history_value_update() {
  var value = document.getElementById('datetime_slider').value;
  var total_intervals = 4 * 24;
  var step_size = total_intervals / 100;
  var steps = Math.floor(value * step_size);
  var hours = Math.floor(steps / 4);
  var minutes = steps * 15 - hours * 60;
  console.log(steps, hours, minutes);
  document.getElementById('datetime_text').innerHTML = "12th March 2014 " + (hours < 10 ? '0' + hours : hours) + ":" + (minutes < 10 ? '0' + minutes : minutes);

  //Clear all markers and redraw all lines according to the new data
  clear_lines();
  draw_lines();
}

function animate_timeline_worker(interval, cont) {
  document.getElementById('datetime_slider').value = interval;
  var value = interval;
  var total_intervals = 4 * 24;
  var step_size = total_intervals / 100;
  var steps = Math.floor(value * step_size);
  var hours = Math.floor(steps / 4);
  var minutes = steps * 15 - hours * 60;
  console.log(steps, hours, minutes);
  document.getElementById('datetime_text').innerHTML = "12th March 2014 " + (hours < 10 ? '0' + hours : hours) + ":" + (minutes < 10 ? '0' + minutes : minutes);

  //Clear all markers and redraw all lines according to the new data
  clear_lines();
  draw_lines();

  if (interval <= 100 && cont) {
    animation_timeout = setTimeout(function() {
      animate_timeline_worker(interval + 1, cont);
    }, 130);
  }
}

function animate_timeline() {
  if (animation_timeout !== null) {
    clearTimeout(animation_timeout);
  }
  //alert(datetime_slider.value);
  animate_timeline_worker(parseInt(datetime_slider.value), true);
}

function pause_timeline(reset) {
  clearTimeout(animation_timeout);
  if (reset) {
    animate_timeline_worker(0, false);
  } else {
    animate_timeline_worker(document.getElementById('datetime_slider').value, false);
  }
}


function initialize() {
  var mapOptions = {
    center: {
      lat: 25.115468,
      lng: 55.225364
    },
    zoom: 11
  };

  map = new google.maps.Map(document.getElementById('map-canvas'),
    mapOptions);

  var history_slider_div = document.createElement('div');
  var history_slider = new historySlider(history_slider_div, map);
  history_slider_div.index = 1;
  map.controls[google.maps.ControlPosition.BOTTOM_LEFT].push(history_slider_div);
}

console.log("Map made");
google.maps.event.addDomListener(window, 'load', initialize);
setTimeout(function() {
  draw_markers();
}, 100);
setTimeout(function() {
  draw_lines();
}, 100);