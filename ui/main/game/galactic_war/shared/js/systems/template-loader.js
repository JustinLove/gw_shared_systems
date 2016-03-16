// !LOCNS:galactic_war
model.cShareSystems_busy = ko.observable(false)
define([
  'coui://ui/mods/cShareSystems/cShareSystems.js'
], function () {

  /*
  requireGW(['main/game/galactic_war/shared/js/systems/titans-normal'], function(temp) {
    temp.forEach(function(set) {
      console.log(set.Players)
      set.Systems.forEach(function(system) {
        min = 0
        max = 0
        system.Planets.forEach(function(planet) {
          if (planet.Biomes[0] != 0) {
            min += 4 * Math.PI * Math.pow(planet.Radius[0], 2)
            max += 4 * Math.PI * Math.pow(planet.Radius[1], 2)
          }
        })
        console.log(min/1000000, max/1000000)
      })
    })
  })
  */

  var serverOptions = [
    {
      "name"		: "Default Server",
      "save_url"	: "http://1-dot-winged-will-482.appspot.com/save",
      "search_url"	: "http://1-dot-winged-will-482.appspot.com/search"
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
    "limit"			: 25
  }

  var searchSystems = function(parameters) {
    var request = $.Deferred()
    $.get(getServer().search_url, parameters, null, 'json')
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

  var fixupPlanetConfig = function (system) {
    var planets = system.planets || [];
    system.surface_area = 0
    for (var p = 0; p < planets.length; ++p)
    {
      var planet = planets[p];
      if (planet.hasOwnProperty('position_x')) {
        planet.position = [planet.position_x, planet.position_y];
        delete planet.position_x;
        delete planet.position_y;
      }
      if (planet.hasOwnProperty('velocity_x')) {
        planet.velocity = [planet.velocity_x, planet.velocity_y];
        delete planet.velocity_x;
        delete planet.velocity_y;
      }
      //console.log(JSON.parse(JSON.stringify(planet, null, 0)))
      if (planet.hasOwnProperty('planet')) {
        if (planet.planet.biome != 'gas') {
          system.surface_area += 4 * Math.PI * Math.pow(planet.planet.radius, 2)
        }
        planet.generator = planet.planet;
        delete planet.planet;
      }
    }
    return system;
  }
  

  var systemsLoaded

  var loadSystems = function() {
    if (!systemsLoaded) {
      console.log('load')
      systemsLoaded = $.Deferred()
      var systems = []
      var crazy = 0
      var next = function(start) {
        console.log('search', start)
        searchSystems($.extend({start: start}, filterOptions))
          .then(function(data) {
            //console.log(data)
            console.log(start, data.total)
            systems = systems.concat(data.systems)
            if (++crazy >= 1) {
              console.log('thats crazy')
              systemsLoaded.resolve(systems.map(fixupPlanetConfig))
              return
            }
            if (data.total > start + filterOptions.limit) {
              next(start + filterOptions.limit)
            } else {
              systemsLoaded.resolve(systems.map(fixupPlanetConfig))
              return
            }
          }, function() {
            // ends in 500
            systemsLoaded.resolve(systems.map(fixupPlanetConfig))
          })
      }
      next(0)
    }
    return systemsLoaded
  }

  var chooseStarSystemTemplates = function(content, easier) {
    console.log('create')
    loadSystems().then(function(sys) {
      console.log(sys.sort(function(a, b) {
        return a.surface_area - b.surface_area
      }).map(function(sys) {return Math.floor(sys.surface_area/1000000)}))
    })

    var generate = function(config) {
      console.log('generate', config)
      return systemsLoaded.then(function(systems) {
        if (systems.length > 0) {
          var i = Math.floor(Math.random() * systems.length)
          console.log('generate', systems[i].surface_area/1000000)
          return systems[i]
        }
      })
    };

    return {
      generate: generate
    };
  };

  return chooseStarSystemTemplates;
});
