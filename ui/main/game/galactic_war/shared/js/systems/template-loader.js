// !LOCNS:galactic_war
define([
  '/mods/gw_shared_systems/shared_systems.js',
  '/mods/gw_shared_systems/template_builder.js',
], function (sharedSystems, generateFromTemplate) {

  /*
  requireGW(['main/game/galactic_war/shared/js/systems/titans-normal'], function(temp) {
    temp.forEach(function(set) {
      console.log(set.Players)
      set.Systems.forEach(function(system) {
        min = 0
        max = 0
        system.Planets.forEach(function(planet) {
          if (planet.Biomes[0] != 'gas') {
            min += 4 * Math.PI * Math.pow(planet.Radius[0], 2)
            max += 4 * Math.PI * Math.pow(planet.Radius[1], 2)
          }
        })
        console.log(min/1000000, max/1000000)
      })
    })
  })
  */

  var chooseStarSystemTemplates = function(content, easier) {
    console.log('create')
    var systemsLoaded = sharedSystems.loadSystems(sharedSystems.getServer().server_url, 10)

    /*
    systemsLoaded = then(function(sys) {
      console.log(sys.sort(function(a, b) {
        return a.surface_area - b.surface_area
      }).map(function(sys) {return Math.floor(sys.surface_area)}))
    })
    */

    var generate = function(config) {
      //console.log('generate', config)

      var pickSystem = function(systems) {
        //console.log(systems)
        var rng = new Math.seedrandom(config.seed !== undefined ? config.seed : Math.random());

        var getRandomInt = function (min, max) {
          return Math.floor(rng() * (max - min + 1)) + min;
        };

        if (systems.length > 0) {
          var min = config.players*0.5
          var max = config.players*3
          var candidates = systems.filter(function(s) {
            return min < s.surface_area && s.surface_area < max
          })
          if (candidates.length < 1) {
            candidates = systems
          }
          var i = getRandomInt(0, candidates.length - 1)
          //console.log(i, candidates.length)
          //console.log('generate', candidates[i].surface_area)
          return candidates[i]
        }
      }

      if (config.template) {
        var p = $.Deferred()
        p.resolve(generateFromTemplate(config))
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
