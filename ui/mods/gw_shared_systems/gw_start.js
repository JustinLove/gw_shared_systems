(function() {
  model.systemSources = ko.observableArray([])

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
          '<label data-bind="attr: {for: id}"><span data-bind="text:name">Name</span> <span data-bind="text:progress"></span><img class="system-group-loading-indicator working" data-bind="visible:loading" src="coui://ui/main/shared/img/working.svg"></label></li>'+
      '</ul>'+
    '</div>')

  requireGW(['main/game/galactic_war/shared/js/systems/template-loader'], function(chooseStarSystemTemplates) {
    chooseStarSystemTemplates.loadOptions().then(function(options) {
      model.selectedNames.subscribe(function(names) {
        chooseStarSystemTemplates.useSources(names)
        // force game build
        model.newGameSeed(Math.floor(Math.random() * 1000000).toString());
      })

      options.forEach(function(opt, i) {
        opt.selected = ko.observable(i == 0)
        opt.id = 'system-group-'+i
      })
      model.systemSources(options)
    })
  })
})()
