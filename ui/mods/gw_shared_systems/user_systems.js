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

  var userSystems = ko.observableArray([]).extend({ db: { local_name: 'systems', db_name: 'misc' }});

  userSystems.subscribe(function(systems) {
    systems.forEach(fixupPlanetConfig)
  })

  var waitForPlanetToLoad = function (planet_spec) {
    var deferred = $.Deferred();

    UberUtility.waitForAttributeLoad(planet_spec, 'csg_key', 'planetCSG', constants.PLANET_CSG_DATABASE).then(function (first) {
      UberUtility.waitForAttributeLoad(first, 'metal_spots_key', 'metal_spots', constants.PLANET_METAL_SPOTS_DATABASE).then(function (second) {
        UberUtility.waitForAttributeLoad(second, 'landing_zones_key', 'landing_zones', constants.PLANET_LANDING_ZONES_DATABASE).then(function (third) {
          _.omit(third, 'source');
          deferred.resolve(third);
        });;
      });
    });

    return deferred.promise();
  };

  var waitForSystemToLoad = function (system, options /* { omit_keys } */) {
    var deferred = $.Deferred();
    var array = _.map(system.planets, waitForPlanetToLoad);

    UberUtility.waitForAll(array).then(function (results) {
      system.planets = results;

      if (options.omit_keys)
        system.planets = _.map(system.planets, function (element) {
          return _.omit(element, ['csg_key', 'metal_spots_key', 'landing_zones_key']);
        });

        deferred.resolve(system);
    });

    return deferred.promise();
  };

  var systemsLoaded

  var load = function(progress) {
    if (systemsLoaded) {
      return systemsLoaded
    }
    progress('0/'+userSystems().length)
    systemsLoaded = $.Deferred()
    $.when(userSystems().map(waitForSystemToLoad)).then(function() {
      progress(userSystems().length+'/'+userSystems().length)
      systemsLoaded.resolve(userSystems())
    })
    return systemsLoaded
  }

  return {
    systems: userSystems,
    load: load,
  }
});
