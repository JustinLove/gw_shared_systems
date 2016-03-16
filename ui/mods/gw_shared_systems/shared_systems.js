// !LOCNS:galactic_war
define([
], function () {

  var fixupPlanetConfig = function (system) {
    UberUtility.fixupPlanetConfig(system)

    system.surface_area = 0
    system.planets.forEach(function(planet) {
      if (planet.generator && planet.generator.biome != 'gas') {
        system.surface_area += 4 * Math.PI * Math.pow(planet.generator.radius, 2) * 0.000001
      }
    })
    return system;
  }

  var serverOptions = [
    {
      "name"		: "Default Server",
      "save_url"	: "http://1-dot-winged-will-482.appspot.com/save",
      "search_url"	: "http://1-dot-winged-will-482.appspot.com/search"
      //"search_url"	: "http://1-dot-realm-sharing.appspot.com/search"
    }
  ]

  var getServer = function() {
    var server = decode(localStorage.getItem('cShareSystems_server'));
    if(server)
      return server;
    else {
      return serverOptions[0];
    }
  };

  var filterOptions = {
    "name"			: "",
    "creator"		: "",
    "minPlanets"	: 1,
    "maxPlanets"	: 16,
    "sort_field"	: "system_id",
    "sort_direction": "DESC",
    "limit"			: 16
  }

  var searchSystems = function(search_url, parameters) {
    var request = $.Deferred()
    parameters.request_time = Date.now();
    $.get(search_url, parameters, null, 'json')
      .then(function(data) {
        if (typeof data == "string") {
          var message = (typeof data == "string");
          request.reject(message)
        } else {
          request.resolve(data)
        }
      }, function(jqXHR, textStatus, errorThrown) {
        request.reject(textStatus, errorThrown)
      })
    return request
  }

  var systemsLoaded = {}

  var loadSystems = function(search_url, fetchLimit) {
    search_url = search_url || getServer().search_url
    if (systemsLoaded[search_url]) {
      return systemsLoaded[search_url]
    }

    console.log('load')
    var promise = systemsLoaded[search_url] = $.Deferred()
    var systems = []
    var next = function(start) {
      console.log('search', start)
      searchSystems(search_url, $.extend({start: start}, filterOptions))
        .then(function(data) {
          //console.log(data)
          systems = systems.concat(data.systems)
          if (systems.length >= fetchLimit) {
            console.warn(systems.length, 'thats crazy')
            promise.resolve(systems.map(fixupPlanetConfig))
            return
          }
          if (data.total > start + filterOptions.limit) {
            next(start + filterOptions.limit)
          } else {
            console.log('no more', data.total)
            promise.resolve(systems.map(fixupPlanetConfig))
            return
          }
        }, function() {
          console.error('fetch failed', start)
          if (systems.length > 0) {
            promise.resolve(systems.map(fixupPlanetConfig))
          } else {
            promise.reject(arguments)
          }
        })
    }
    next(0)
    return promise
  }

  return {
    getServer: getServer,
    loadSystems: loadSystems,
  }
});
