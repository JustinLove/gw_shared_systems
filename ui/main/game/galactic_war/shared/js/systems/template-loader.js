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

  var nameBlocklist = [
    'flint and steel', // start planets immediately collide
    'Molten Metal', // bugged pathing, no metal
    'Water World', // reported to have no spawn locations
  ]

  var complexBlocklist = [
    _.matches({ // all planets immediately collide
      creator: 'octobomb',
      planets: [
        {name: 'Footfall'},
        {name: 'Mariani'},
      ]
    }),
  ]

  var countMultiplanet = function(systems) {
    var multi = 0
    systems.forEach(function(system) {
      if (system.planets.length > 1) {
        multi++
      }
    })
    return " (" + multi + ")"
  }

  var withoutBrokenSystems = function(systems) {
    return systems.filter(function(system) {
      if (nameBlocklist.indexOf(system.name) != -1) return false
      for (var b in complexBlocklist) {
        if (complexBlocklist[b](system)) return false
      }

      var startingPlanets = 0
      for (var i in system.planets) {
        var planet = system.planets[i]
        if (planet.starting_planet) {
          startingPlanets++
        }
        if (biomes.indexOf(planet.generator.biome) == -1) {
          return false
        }
      }

      if (startingPlanets < 1) {
        system.planets[0].starting_planet = true
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

  var loadSelectedSources = function(choices) {
    var systemsLoaded = $.Deferred()

    loadOptions().then(function(options) {
      var loading = []
      choices.forEach(function(name) {
        var it = _.find(options, 'name', name)
        if (it) {
          it.loading(true)
          loading.push(it.load()
                        .always(function() {it.loading(false)})
                        .fail(function() { if (it.selected) {it.selected(false)}})
                      )
        }
      })
      $.when.apply($, loading).then(function() {
        if (arguments.length > 0) {
          systemsLoaded.resolve(_.flatten(arguments))
        } else {
          systemsLoaded.reject()
        }
      })
    })

    return systemsLoaded
  }

  var chooseStarSystemTemplates = function(content, easier) {
    //console.log('create')
    var systemsLoaded = loadSelectedSources(choices)

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
        systems = withoutBrokenSystems(systems)
        //console.log(systems)
        var rng = new Math.seedrandom(config.seed !== undefined ? config.seed : Math.random());

        var getRandomInt = function (min, max) {
          return Math.floor(rng() * (max - min + 1)) + min;
        };

        if (systems.length > 0) {
          var min = config.players*0.5
          var max = config.players*4
          var candidates = systems.filter(function(s) {
            return min < s.surface_area && s.surface_area < max
          })
          if (candidates.length < 1) {
            candidates = systems
          }
          var i = getRandomInt(0, candidates.length - 1)
          //console.log(i, candidates.length)
          //console.log('generate', candidates[i].surface_area)
          return JSON.parse(JSON.stringify(candidates[i]))
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

  var userProgress = ko.observable('')
  var baseOptions = [
    {
      name: 'Uber',
      remote: false,
      progress: ko.observable(premade.length.toString() + countMultiplanet(premade)),
      loading: ko.observable(false),
      load: function() {
        var promise = $.Deferred()
        promise.resolve(premade)
        return promise
      },
    },
    {
      name: 'My Systems',
      remote: false,
      progress: userProgress,
      loading: ko.observable(false),
      load: function() {
        return user.load(userProgress)
      },
    },
  ]

  var optionsPromise

  var loadOptions = function() {
    if (optionsPromise) return optionsPromise

    var options = _.cloneDeep(baseOptions)
    //var serverPromise = $.Deferred(); serverPromise.resolve(true)
    var serverPromise = sharedSystems.getServerList().then(function(servers) {
      servers.forEach(function(server) {
        var progress = ko.observable('')
        options.push({
          name: server.name,
          remote: true,
          progress: progress,
          loading: ko.observable(false),
          load: function() {
            return sharedSystems.loadSystems(server.search_url, 200, progress)
          },
        })
      })
    })

    var packPromise = mapPacks.mapPackList().then(function(packs) {
      Object.keys(packs).forEach(function(name) {
        var progress = ko.observable('')
        options.push({
          name: name,
          remote: false,
          progress: progress,
          loading: ko.observable(false),
          load: function() {
            return mapPacks.loadPack(name, progress)
          },
        })
      })
    })

    optionsPromise = $.when(serverPromise, packPromise).then(function() {
      return options
    })
    return optionsPromise
  }

  var choices = []
  var useSources = function(names) {
    choices = names
  }

  chooseStarSystemTemplates.loadOptions = loadOptions
  chooseStarSystemTemplates.useSources = useSources

  return chooseStarSystemTemplates;
});
