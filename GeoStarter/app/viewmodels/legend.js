define(['durandal/app', 'durandal/system', 'knockout'], function (app, system, ko) {

    var _pastDays = ko.observable(1);

    _pastDays.subscribe(function (val) {
        app.trigger('legend:days', val);
    });

    return {

        pastDays: _pastDays,

        activate: function () {
            system.log('Lifecycle : activate : legend');
        }
    };
});