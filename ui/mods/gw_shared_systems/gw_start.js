(function() {
  model.systemSources = ko.observableArray([])

  model.persistedNames = ko.observable(["Uber"]).extend({local: 'gw_shared_systems_persisted_names'})

  model.selectedNames = ko.computed(function() {
    var names = []
    model.systemSources().forEach(function(opt) {
      if (opt.selected()) {
        names.push(opt.name)
      }
    })
    return names
  })

  $('#new-game-right .col-padding').append(
    '<div class="form-group">'+
      '<label id="system-sources-label" for="system-sources"><loc>Systems</loc></label>'+
      '<ul class="form-control" data-bind="foreach: systemSources">'+
        '<li class="system-group" data-bind="css: {selected: selected}">'+
          '<input type="checkbox" data-bind="attr: {id: id}, checked: selected"/>'+
          '<label data-bind="attr: {for: id}">'+
            '<span data-bind="text:name">Name</span> '+
            '<span data-bind="text:progress, tooltip: \'Downloaded/Total (Number of Multiplanet)\'"></span>'+
            '<img class="system-group-loading-indicator working" data-bind="visible:loading" src="coui://ui/main/shared/img/working.svg">'+
            '<img class="system-group-remote" data-bind="visible:remote, tooltip: \'Remote, may take some time to download\'" src="coui://ui/mods/gw_shared_systems/cloud-download.svg">'+
          '</label>'+
        '</li>'+
      '</ul>'+
    '</div>')

  requireGW(['main/game/galactic_war/shared/js/systems/template-loader'], function(chooseStarSystemTemplates) {
    chooseStarSystemTemplates.loadOptions().then(function(options) {
      model.selectedNames.subscribe(function(names) {
        chooseStarSystemTemplates.useSources(names)
        // force game build
        model.newGameSeed(Math.floor(Math.random() * 1000000).toString());
        model.persistedNames(names)
      })

      options.forEach(function(opt, i) {
        opt.selected = ko.observable(model.persistedNames().indexOf(opt.name) != -1)
        opt.id = 'system-group-'+i
      })
      model.systemSources(options)
    })
  })
})()
