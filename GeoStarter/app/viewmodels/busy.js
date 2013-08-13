define(['durandal/app', 'modules/spinner', 'knockout'], function (app, spinner, ko) {

    var _this = this;
    var isVisible = ko.observable(false);

    return {
        isVisible: isVisible,
        compositionComplete: function () {

            // create spinner
            var cl = new spinner.spinner.canvasLoader('canvasloader-container');
            cl.setColor('#f77708');
            cl.setShape('spiral');
            cl.setDiameter(146);
            cl.setDensity(18);
            cl.setRange(1);
            cl.setSpeed(1);
            cl.setFPS(16);
            cl.show();

            // subscribe to busy event
            app.on('busy').then(function (state) {
                isVisible(state);
            }, _this);
        }
    };
});