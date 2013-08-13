requirejs.config({
    paths: {
        'scripts': '../Scripts',
        'text': '../Scripts/text',
        'durandal': '../Scripts/durandal',
        'plugins': '../Scripts/durandal/plugins',
        'transitions': '../Scripts/durandal/transitions',
        'modules': './modules',
        'knockout': '../Scripts/knockout-2.2.1',
        'mapsjs': '../Scripts/isc.rim'
    }
});

define('jquery', [], function () { return jQuery; });

define(['durandal/system', 'durandal/app', 'durandal/viewLocator', 'durandal/composition', 'knockout'],
    function (system, app, viewLocator, composition) {

    //>>excludeStart("build", true);
    system.debug(true);
    //>>excludeEnd("build");

    app.title = 'MapsJS and Durandal Starter Kit';

    // Durandal plugins
    app.configurePlugins({
        router: true,
        dialog: true,
        widget: true
    });


    app.configurePlugins({
        earthquakes: true
    }, 'modules');

    app.start().then(function () {
        //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
        //Look for partial views in a 'views' folder in the root.
        viewLocator.useConvention();

        // tells Durandal to call the mapsjs custom binding after composition complete
        // this is necessary for the map control to have its parent dimensions set before it composes internally
        composition.addBindingHandler('rimMap');

        // show the app by setting the root view model.
        app.setRoot('viewmodels/shell');

    });
});
