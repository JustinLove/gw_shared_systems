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

  var mapPacks = {}

  window.cShareSystems = window.cShareSystems || {}
  cShareSystems.load_pas = function(tabName, fileArray) {
    mapPacks[tabName] = {files: fileArray, systems: [], promise: null}
  }

  var loadPack = function(tabName) {
    if (mapPacks[tabName].promise) {
      return mapPacks[tabName].promise
    }
    mapPacks[tabName].promise = $.Deferred()
    var fileArray = mapPacks[tabName].files
    var systems = mapPacks[tabName].systems
    var counter = fileArray.length;

    for (arrayItem in fileArray) {
      var fileName = fileArray[arrayItem];

      $.getJSON(fileName, function(data) {
        systems.push(data);
      }).always(function() {
        counter--;

        if (counter <= 0) {
          systems.forEach(fixupPlanetConfig)
          mapPacks[tabName].promise.resolve(systems)
        }
      });
    }

    return mapPacks[tabName].promise
  };

  var mapPacksLoaded

  var mapPackList = function() {
    if (mapPacksLoaded) {
      return mapPacksLoaded
    }
    mapPacksLoaded = $.Deferred()
    $.when((scene_mod_list.load_planet || []).map(function(path) {
      return $.get(path, null, null, 'text').then(function(contents) {
        if (contents.match(/cShareSystems.load_pas\s*\(/)) {
          var se = document.createElement('script');
          se.type = "text/javascript";
          se.text = contents;
          document.getElementsByTagName('head')[0].appendChild(se);
        }
      })
    })).always(function() {
      mapPacksLoaded.resolve(mapPacks)
    })
    return mapPacksLoaded
  }

  return {
    mapPackList: mapPackList,
    loadPack: loadPack
  }
});
