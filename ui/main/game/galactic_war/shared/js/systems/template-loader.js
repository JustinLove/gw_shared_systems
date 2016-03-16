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
  var planet_template = {
    name: "Default Planet",
    mass: 5000,
    position: [0, 0],
    velocity: [0, 0],
    required_thrust_to_move: 0,
    generator: {
      seed: 15,
      radius: 100,
      heightRange: 25,
      waterHeight: 35,
      temperature: 100,
      metalDensity: 50,
      metalClusters: 50,
      biomeScale: 100,
      biome: "earth"
    }
  };

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
  var fetchLimit = 10

  var searchSystems = function(parameters) {
    var request = $.Deferred()
    parameters.request_time = Date.now();
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

  var systemsLoaded

  var loadSystems = function() {
    if (!systemsLoaded) {
      console.log('load')
      systemsLoaded = $.Deferred()
      var systems = []
      var next = function(start) {
        console.log('search', start)
        searchSystems($.extend({start: start}, filterOptions))
          .then(function(data) {
            //console.log(data)
            systems = systems.concat(data.systems)
            if (systems.length >= fetchLimit) {
              console.warn(systems.length, 'thats crazy')
              systemsLoaded.resolve(systems.map(fixupPlanetConfig))
              return
            }
            if (data.total > start + filterOptions.limit) {
              next(start + filterOptions.limit)
            } else {
              console.log('no more', data.total)
              systemsLoaded.resolve(systems.map(fixupPlanetConfig))
              return
            }
          }, function() {
            console.error('fetch failed', start)
            if (systems.length > 0) {
              systemsLoaded.resolve(systems.map(fixupPlanetConfig))
            } else {
              systemsLoaded.reject(arguments)
            }
          })
      }
      next(0)
    }
    return systemsLoaded
  }


  var chooseStarSystemTemplates = function(content, easier) {
    console.log('create')
    loadSystems()

    /*
    systemsLoaded.then(function(sys) {
      console.log(sys.sort(function(a, b) {
        return a.surface_area - b.surface_area
      }).map(function(sys) {return Math.floor(sys.surface_area)}))
    })
    */

    var generate = function(config) {
      console.log('generate', config)
      var rng = new Math.seedrandom(config.seed !== undefined ? config.seed : Math.random());

      var getRandomInt = function (min, max) {
        return Math.floor(rng() * (max - min + 1)) + min;
      };

      var generateFromTemplate = function(template) {
        var rSystem = {
          name: config.name || ("PA-" + getRandomInt(100, 30000)),
          description: '',
          isRandomlyGenerated: true
        };

        var cSys = _.cloneDeep(template);
        rSystem.planets = _.map(cSys.Planets, function(plnt, index) {
          var bp = _.cloneDeep(planet_template);
          bp.generator.seed = getRandomInt(0, 32767);
          bp.generator.biome = _.sample(plnt.Biomes);

          bp.generator.radius = getRandomInt(plnt.Radius[0], plnt.Radius[1])
          bp.generator.heightRange = getRandomInt(plnt.Height[0], plnt.Height[1]);
          bp.generator.waterHeight = getRandomInt(plnt.Water[0], plnt.Water[1]);
          bp.generator.waterDepth = 100;
          bp.generator.temperature = getRandomInt(plnt.Temp[0], plnt.Temp[1]);
          bp.generator.biomeScale = getRandomInt(plnt.BiomeScale[0], plnt.BiomeScale[1]);
          bp.generator.metalDensity = getRandomInt(plnt.MetalDensity[0], plnt.MetalDensity[1]);
          bp.generator.metalClusters = getRandomInt(plnt.MetalClusters[0], plnt.MetalClusters[1]);
          bp.generator.index = index;
          bp.name = plnt.name;
          bp.position = plnt.Position;
          bp.velocity = plnt.Velocity;
          bp.required_thrust_to_move = getRandomInt(plnt.Thrust[0], plnt.Thrust[1]);
          bp.mass = plnt.mass;
          bp.starting_planet = plnt.starting_planet;

          return bp;
        });
        return rSystem
      }

      var pickSystem = function(systems) {
        if (systems.length > 0) {
          var min = config.players
          var max = config.players*15
          var candidates = systems.filter(function(s) {
            return min < s.surface_area && s.surface_area < max
          })
          if (candidates.length < 1) {
            candidates = systems
          }
          var i = getRandomInt(0, candidates.length - 1)
          //console.log(i, candidates.length)
          //console.log('generate', candidates[i].surface_area)
          return systems[i]
        }
      }

      if (config.template) {
        var p = $.Deferred()
        p.resolve(generateFromTemplate(config.template))
        return p
      } else {
        return systemsLoaded.then(pickSystem)
      }
    };

    return {
      generate: generate
    };
  };

  return chooseStarSystemTemplates;
});
