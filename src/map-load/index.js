var d3 = require('d3'), topojson = require('topojson-client'),
  panzoom = require('panzoom'),
  zoom = require('d3-zoom'),
  width = window.outerWidth, height = window.outerHeight,
  projection = d3.geo.equirectangular()
    .scale(175).translate([width / 2, 0]), path = d3.geo.path().projection(projection),
  d3_map = d3.select("body").call(zoom.zoom).append("svg:svg").attr("width", width)
    .attr("height", height).append('svg:g').attr('id', 'mapmap'),
  states = d3_map.append("svg:g").attr("class", "states"),
  locations = d3_map.append("svg:g").attr("class", "locations"),
    phaseColors = ['black', 'red', 'skyblue', 'tan'];

panzoom(document.querySelector('#mapmap'), { minZoom: 1 });

var int = setInterval(
  function() {
    if (window.__DATA__) {
      var sel = document.querySelector('#filter'),
        comp = document.querySelector('#completed'), rec = document.querySelector('#recruiting');
        locations = [], statuses = [];
      for (var r = 0; r < window.__DATA__.data.length; r++) {
        if (window.__DATA__.data[r].LOCATION) {
          var c = window.__DATA__.data[r].LOCATION.split(', ').slice(-1)[0].replace("']", "").replace("'", '');
          if (!locations.includes(c)) locations.push(c);
        }
        if (window.__DATA__.data[r].Status) {
          var c = window.__DATA__.data[r].Status;
          if (!statuses.includes(c)) statuses.push(c);
        }
      }
      locations.sort();
      for (var l = 0; l < locations.length; l++) {
        var op = document.createElement("OPTION");
        op.innerHTML = locations[l];
        op.value = locations[l];
        sel.appendChild(op);
      }

      for (var l = 0; l < statuses.length; l++) {
        var op = document.createElement("OPTION");
        op.innerHTML = statuses[l];
        op.value = statuses[l];
        rec.appendChild(op);
      }

      function render(event) {
        let filterVal = document.querySelector('#filter').value,
          completedVal = document.querySelector('#completed').value,
          statusVal = document.querySelector('#recruiting').value;
        d3.selectAll('circle').remove();
        let dat = (filterVal !== 'All') ?
          window.__DATA__.data.filter(node =>
          node.LOCATION && node.LOCATION.indexOf(filterVal) > -1 || false) :
          window.__DATA__.data.slice(0,-1);

        if (completedVal !== 'All') {
          dat = dat.filter(node =>
            completedVal === 'Not Completed' ?
            +new Date(node["Completion Date"]) > +new Date() :
            +new Date(node["Completion Date"]) < +new Date())
        }

        if (statusVal !== 'All') {
          dat = dat.filter(node => node.Status === statusVal);
        }

        d3.json('./d3-geomap/topojson/world/countries.json', function(collection) {
          var feats = topojson.feature(collection, collection.objects.units);
          states.selectAll('path')
            .data(feats.features).enter().append('path').attr('d', path).attr('fill', '#D2D2D2').attr('stroke', 'black').attr('strokewidth', 0.5);
          }), coordinates = dat.filter(node =>
            node.LATITUDE !== '' && node.LATITUDE !== 'NULL' &&
            node.LONGITUDE !== '' && node.LONGITUDE !== 'NULL').map((node, k) => ({
            n: k,
            coordinates: [node.LONGITUDE, node.LATITUDE],
            label: node.LOCATION,
            phase: ['Not Applicable', ''].includes(node.Phases) ? 0 :
              parseInt(node.Phases.split(' ').splice(-1)[0]),
            phaseText: node.Phases,
            status: node.Status,
            completionDate: new Date(node["Completion Date"]),
            completionDateText: node["Completion Date"],
            firstPosted: new Date(node["First Posted"]),
            startDate: new Date(node['Start Date']),
            startDateText: node['Start Date']
          })), locations = d3.select(".locations").selectAll('circle')
          .data(coordinates);

        let map = {
          x: { min: 0, max: 0 },
          y: { min: 0, max: 0 }
        }

        locations.enter().append("svg:circle")
          .attr("cy", function(d) {
            map.y.min = Math.min(d.coordinates[1], map.y.min);
            map.y.max = Math.max(d.coordinates[1], map.y.max);
            return projection(d.coordinates)[1];
          })
        	.attr("cx", function(d) {
            map.x.min = Math.min(d.coordinates[0], map.x.min);
            map.x.max = Math.max(d.coordinates[0], map.x.max);
            return projection(d.coordinates)[0];
          })
          .attr("id", function(d) { return d.label; })
          .attr("r", 7).attr('fill', function(d) { return phaseColors[d.phase]; })
          .attr('stroke', 'black').attr('strokewidth', 1).on('mouseover', function(d, i) {
            d3.select(this).attr('fill', '#0F0');
            document.querySelector('#follow__location').innerHTML = d.label;
            document.querySelector('#follow__phase').innerHTML = d.phaseText;

            document.querySelector('#follow__date__label').innerHTML = ""
            if (+new Date() < +d.completionDate) {
              document.querySelector('#follow__date__label').innerHTML = "Start Date";
              document.querySelector('#follow__date__value').innerHTML = d.startDateText;
            }
            else {
              document.querySelector('#follow__date__label').innerHTML = "Completion Date";
              document.querySelector('#follow__date__value').innerHTML = d.completionDateText;
            }

            document.querySelector('#follow__status').innerHTML = d.status;
            document.querySelector('#follow').style.left = d3.event.pageX.toString() + 'px';
            document.querySelector('#follow').style.top = d3.event.pageY.toString() + 'px';
            document.querySelector('#follow').style.opacity = 1;
            document.querySelector('#follow').style.display = 'block';
          }).on('mouseout', function(d) {
            d3.select(this).attr('fill', phaseColors[d.phase]).attr('stroke', 'black').attr('strokewidth', 1);
            document.querySelector('#follow').style.opacity = 0;
            document.querySelector('#follow').style.display = 'none';
          });

        document.querySelector('#count').innerHTML = dat.length;
      }

      sel.addEventListener('change', render);
      comp.addEventListener('change', render);
      rec.addEventListener('change', render);
      render(null);
      clearInterval(int);
    }
  }
, 1000);
