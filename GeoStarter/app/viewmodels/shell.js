define(['plugins/router'], function (router) {

    return {
        router: router,
        activate: function () {
            router.map([
                { route: '', moduleId: 'viewmodels/map', title: 'Map View', nav: true }
            ]).buildNavigationModel();

            return router.activate();
        }
    };
});