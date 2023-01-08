I've encountered an issue and odd workaround for Shared Systems for Galactic War's tab loading.

Flubb's Tremendous Map Pack and Galactic War Multiplanetary Systems (https://github.com/Quitch/Galactic-War-Multiplanetary-Systems) both use means other than a static array. The former uses api.file.get(), an example of which is included below:

api.file.list('/client_mods/com.flubbateios.mappack/ui/mods/com.flubbateios.mappack/flubb/').then(function (r) {
    var maps = [];
    for (var x in r) {
        maps.push(r[x].replace('/client_mods/com.flubbateios.mappack/', 'coui://'));
    }
    cShareSystems.load_pas("flubb's Tremendous Map Pack", maps);
});


The latter checks for existing map packs and pushes to an array based on what's loaded. An example of the load_map.js code is included below:

      api.mods.getMounted("client", true).then(function (mods) {
        var modMounted = function (modIdentifier) {
          return _.some(mods, { identifier: modIdentifier });
        };

        var multiplanetarySystems = [];

        if (modMounted("com.pa.grandhomie.maps")) {
          multiplanetarySystems.push(
            "coui://ui/mods/grandhomie/systems/32_ffa.pas"
          );
        }

        cShareSystems.load_pas("Multiplanetary", multiplanetarySystems);
      });


Currently the mod will not display the tabs from these mods in the Galactic War lobby.

However, I found that adding a mapPackList() call at the bottom your mod's map_pack.js before the final return causes the tabs to display properly, even if it's only called by console.debug(). It is beyond me why this is (since this function appears to always be called by template_loader.js), but I'm hoping this means a fix can be created to support such mods. The Galactic War Multiplanetary Systems mod was created specifically for use with Shared Systems for Galactic War, and I didn't realise this approach wasn't supported until I was done.
Quitch
 — 
Yesterday at 13:26
Hmm, have I made a bad assumption? Both do their additions asynchronously, so it's a timing thing perhaps?
Quitch
 — 
Yesterday at 13:45
OK, it's a timing issue for sure. mapPackList() appears to be completing before these two mods have run cShareSystems.load_pas(). I'm not sure what can be done about that.
