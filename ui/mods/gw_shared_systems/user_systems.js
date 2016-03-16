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

  window.userSystems = userSystems

  return userSystems
});
