// !LOCNS:galactic_war
define([
], function () {
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

  return function(config) {
    //console.log('generate template', config)
    var rng = new Math.seedrandom(config.seed !== undefined ? config.seed : Math.random());

    var getRandomInt = function (min, max) {
      return Math.floor(rng() * (max - min + 1)) + min;
    };

    var rSystem = {
      name: config.name || ("PA-" + getRandomInt(100, 30000)),
      description: '',
      isRandomlyGenerated: true
    };

    var cSys = _.cloneDeep(config.template);
    rSystem.planets = _.map(cSys.Planets, function(plnt, index) {
      //console.log(plnt);
      if (plnt.isExplicit) {
        return _.cloneDeep(plnt);
      }
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
  };
});
