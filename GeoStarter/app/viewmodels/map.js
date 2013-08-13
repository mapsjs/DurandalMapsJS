define(['durandal/app', 'durandal/viewEngine', 'durandal/system', 'knockout', 'mapsjs'], function (app, viewEngine, system, ko, isc) {
   
    var _map;
    var _this = this;
    var _dataKo = ko.observableArray();
    var _zoomLevel = ko.observable(5);
    var _mapCenter = ko.observable({ x: -12908784, y: 5004792 });
    var _baseMapDescriptor = ko.observable('a');
    var _lastCallout;

    var _baseMapSelect = function () {

        var c = $('.mapsjsMap');

        if (_baseMapDescriptor() == 'r') {
            _baseMapDescriptor('a');
            c.css('background', '#000e1b');
        }
        else {
            _baseMapDescriptor('r');
            c.css('background', '#bbd0ed');
        }
    };

    var _zoomIn = function () {
        _map.rimMap('zoomDeltaAnimate', 1);
    };

    var _zoomOut = function () {
        _map.rimMap('zoomDeltaAnimate', -1);
    };

    // watches this message to place a callout on the map from an identify query result
    app.on('earthquake:query-result').then(function (feature) {
        if (_map) {
            viewEngine.createView('views/callout').then(function (callout) {

                if (_lastCallout) {
                    _map.rimMap('removeFixedContentElement', _lastCallout);
                }
                _lastCallout = callout;

                $(callout).find('#calloutText').text('mag: ' + feature.magnitude + ' : ' + feature.place);
                _map.rimMap('addFixedContentElement', callout, feature.shape.getX(), feature.shape.getY());
            });
        }
    }, _this);

    return {
        
        mapOptions: {
            zoomLevel: _zoomLevel,
            mapCenter: _mapCenter,
            layers: [
                new isc.rim.tile.layerOptions('base',
                {
                    useBackdrop: true,
                    requestor: new isc.rim.tile.requestorBing(),
                    descriptor: _baseMapDescriptor
                }),

                // client-side rendered point layer on top
                new isc.rim.tile.layerOptions('pointLayer',
                {
                    useBackdrop: false,
                    retainInterlevelContent: false,
                    tileBleedPix: 0,

                    // local data requestor
                    requestor: new isc.rim.tile.requestorLocal({
                        data: _dataKo
                    }),

                    // local data descriptor
                    descriptor: new isc.rim.tile.descriptorLocal({
                        valueFieldNames: ['_radius', '_sum', 'magnitude'],
                        geometryFieldName: 'shape',
                        bleedRatio: 1.25
                    }),

                    // set the renderer and a nested render point function
                    // this converts the downloaded point geometry into paths painted on the tile canvas
                    // this approach is far more performant than creating dom elements for each point when the number of points is large
                    // note: the point geometry has been normalized to the canvas coordinate system before passing to this function
                    renderer: new isc.rim.tile.renderer({
                        renderPoint: function (pt, context) {

                            var rad = pt.fieldValues[0];
                            var sum = pt.fieldValues[1];
                            var mag = pt.fieldValues[2] || 0;

                            // we will change size of epicenter for stronger earthquakes
                            // the ratio should be from 0.85 for strongest (mag >= 6) to 0.15 for weakest
                            var epiRat = Math.min(0.15 + (mag / 8), 0.85);

                            var x = pt.getX();
                            var y = pt.getY();

                            context.globalAlpha = 0.4;
                            context.beginPath();
                            context.arc(x, y, rad, 0, 2 * Math.PI, true);
                            context.fillStyle = 'orange';
                            context.fill();

                            if (sum == 1) {
                                context.globalAlpha = 1.0;
                                context.beginPath();
                                context.arc(x, y, rad * epiRat, 0, 2 * Math.PI, true);
                                context.fillStyle = 'darkorange';
                                context.fill();

                                // if magnitude >= 4.5 mark it
                                if (mag >= 4.5) {
                                    context.globalAlpha = 0.5;
                                    context.lineWidth = 0.5 + (mag - 4.5);
                                    context.strokeStyle = 'white';
                                    context.stroke();
                                }
                            }
                            else {
                                context.globalAlpha = 0.2;
                                context.beginPath();
                                context.arc(x, y, rad * 1.25, 0, 2 * Math.PI, true);
                                context.fillStyle = 'orange';
                                context.fill();

                                context.globalAlpha = 1.0;
                                context.font = '12px Calibri';
                                context.textAlign = 'center';
                                context.textBaseline = 'middle';
                                context.fillStyle = 'white';
                                context.fillText(sum, x, y);
                            }
                        }
                    })
                })
            ],

           
            // this is called after the map has fully initialized
            mapInitializedAction: function (m) {
                _map = m;

                // publish map is initialized message
                app.trigger('map:initialized', m);

                // load earthquake data
                app.trigger('earthquakes:fetch', _dataKo);
            },

            // publish map pointer click events
            pointerClickAction: function (pt) {
                app.trigger('map:pointer-click', pt);
            },

            // publish map hover events
            pointerHoverAction: function (pt) {
                app.trigger('map:pointer-hover', pt);
            },

            // publish extent change events
            extentChangeCompleteAction: function (e) {
                app.trigger('map:extents-change', e);
            }
        },

        baseMapSelect: _baseMapSelect,
        zoomIn: _zoomIn,
        zoomOut: _zoomOut,

        activate: function () {
            system.log('Lifecycle : activate : map');
        }
    };
});