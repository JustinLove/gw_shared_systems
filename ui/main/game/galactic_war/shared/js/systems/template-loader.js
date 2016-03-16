// !LOCNS:galactic_war
define([
  '/mods/gw_shared_systems/shared_systems.js',
  '/mods/gw_shared_systems/map_packs.js',
  '/mods/gw_shared_systems/template_builder.js',
  '/main/shared/js/premade_systems.js',
  '/mods/gw_shared_systems/user_systems.js',
], function (sharedSystems, mapPacks, generateFromTemplate, premade, user) {

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

 var biomes = [
  'earth', 'desert', 'lava', 'metal', 'moon', 'tropical', 'gas',
  '1v1test', 'asteroid', 'csg_debug', 'ice_boss', 'metal_boss', 'sandbox',
 ]

 var blacklist = function(systems) {
   return systems.filter(function(system) {
     for (var i in system.planets) {
       if (biomes.indexOf(system.planets[i].generator.biome) == -1) {
         return false
       }
     }

     return true
   })
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

  premade.forEach(fixupPlanetConfig)

  var chooseStarSystemTemplates = function(content, easier) {
    console.log('create')
    //var systemsLoaded = sharedSystems.loadSystems(sharedSystems.getServer().server_url, 10)
    var systemsLoaded = $.Deferred()
    //systemsLoaded.resolve(premade)
    //systemsLoaded.resolve(user())
    mapPacks.mapPackList().then(function(packs) {
      $.when.apply($, Object.keys(packs).map(function(name) {
        return mapPacks.loadPack(name)
      })).then(function() {
        if (arguments.length > 0) {
          systemsLoaded.resolve(_.flatten(arguments))
        } else {
          systemsLoaded.reject()
        }
      })
    })

    /*
    systemsLoaded.then(function(sys) {
      console.log(sys.sort(function(a, b) {
        return a.surface_area - b.surface_area
      }).map(function(sys) {return Math.floor(sys.surface_area)}))
    })
    */

    var generate = function(config) {
      //console.log('generate', config)

      var pickSystem = function(systems) {
        systems = blacklist(systems)
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
          console.log(i, candidates.length)
          console.log('generate', candidates[i].surface_area)
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
