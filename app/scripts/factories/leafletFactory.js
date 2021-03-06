/**
 * @ngdoc service
 * @name AQ.factory:leaflet
 *
 * @description
 * Initializes and stores Leaflet map.
 */
AQ.factory('leaflet', function () {
  'use strict';

  var leaflet = {};

  /**
   * @ngdoc method
   * @name AQ.factory:leaflet#init
   * @methodOf AQ.factory:leaflet
   *
   * @description
   * Initializes Leaflet map with the given GeoJSON object.
   *
   * Map can then be accessed through the property `leaflet.map`, and usual Leaflet functionality
   * can be used.
   *
   * @param {Object} geoJson A valid GeoJSON object.
   */
  leaflet.init = function (geoJson) {
    if (_.isUndefined(geoJson)) {
      throw new Error('GeoJSON not specified');
    } else if (!_.isPlainObject(geoJson)) {
      throw new Error('GeoJSON must be plain object');
    }

    leaflet.map = L.map('map').setView([51.5, -0.1], 10);
    leaflet.marker = undefined;

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: '<a href="http://mapbox.com" target="blank">Mapbox</a>',
      minZoom: 3,
      maxZoom: 19,
      reuseTiles: true,
      id: 'empress.lci7b1km',
      accessToken: 'pk.eyJ1IjoiZW1wcmVzcyIsImEiOiJLRlp4aXN3In0.KS6UybthzK0BTRJhYVkBgg'
    }).addTo(leaflet.map);

    leaflet.data = L.geoJson(geoJson, {
      onEachFeature: function (feature, layer) {
        layer.setIcon(L.icon({
          iconUrl: 'images/marker.png',
          iconSize: [32, 37]
        }));

        leaflet.marker = layer;
      }
    }).addTo(leaflet.map);

    leaflet.marker.on('click', function () {
      leaflet.map.fitBounds(leaflet.data.getBounds());
    });
    leaflet.marker.fire('click');
  };

  return leaflet;
});
