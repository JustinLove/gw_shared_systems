// !LOCNS:galactic_war
define([
], function () {

  var countMultiplanet = function(systems) {
    var multi = 0
    systems.forEach(function(system) {
      if (system.planets.length > 1) {
        multi++
      }
    })
    return " (" + multi + ")"
  }

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

  var serverListUrl = "https://raw.githubusercontent.com/pamods/mods-conundrum/master/cShareSystems_serverList/serverlist.json";

  var defaultServer = "http://1-dot-winged-will-482.appspot.com/search"

  var serverOptions = [
    {
      "name"		: "Default Server",
      "save_url"	: "http://1-dot-winged-will-482.appspot.com/save",
      "search_url"	: "http://1-dot-winged-will-482.appspot.com/search"
      //"search_url"	: "http://1-dot-realm-sharing.appspot.com/search"
    }
  ]

  var getServerList = function() {
    return $.getJSON(serverListUrl).then(function(data) {
      if (!data || !data.servers) return;

      serverOptions = data.servers
      return serverOptions
    });
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

  var loadSystems = function(search_url, fetchLimit, progress) {
    search_url = search_url || serverOptions[0].search_url
    if (systemsLoaded[search_url]) {
      return systemsLoaded[search_url]
    }

    console.log('load')
    var promise = systemsLoaded[search_url] = $.Deferred()
    var systems = []
    progress(systems.length+'/'+fetchLimit + countMultiplanet(systems))
    var next = function(start) {
      if (search_url == defaultServer) {
        //approximate number 2016-03-17
        start = Math.floor(Math.random()*2600)
      }
      console.log('search', start)
      searchSystems(search_url, $.extend({start: start}, filterOptions))
        .then(function(data) {
          //console.log(data)
          systems = systems.concat(data.systems)
          progress(systems.length+'/'+fetchLimit + countMultiplanet(systems))
          if (systems.length >= fetchLimit) {
            console.warn(systems.length, 'thats crazy')
            progress(systems.length+'/'+systems.length + countMultiplanet(systems))
            promise.resolve(systems.map(fixupPlanetConfig))
            return
          }
          if (data.total > start + filterOptions.limit) {
            next(start + filterOptions.limit)
          } else {
            console.log('no more', data.total)
            progress(systems.length+'/'+systems.length + countMultiplanet(systems))
            promise.resolve(systems.map(fixupPlanetConfig))
            return
          }
        }, function() {
          console.error('fetch failed', start)
          if (systems.length > 0) {
            progress(systems.length+'/'+systems.length + countMultiplanet(systems))
            promise.resolve(systems.map(fixupPlanetConfig))
          } else {
            progress('0')
            promise.reject(arguments)
          }
        })
    }
    next(0)
    return promise
  }

  return {
    getServerList: getServerList,
    loadSystems: loadSystems,
  }
});
