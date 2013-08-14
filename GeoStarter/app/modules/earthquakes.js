define(['durandal/app', 'mapsjs'], function (app, isc) {

    var _this = this;
    var _data = null;
    var _dataKo;
    var _currentMapUnitsPerPixel = 1;

    var _options = {
        url: 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp',
        timeout: 10000,
        dataType: 'jsonp',
        cache: false
    };

    // point clustering function
    var _cluster = function () {

        if (_data && _currentMapUnitsPerPixel) {
            var opts = {
                data: _data,
                pointKey: 'shape',
                valueFunction: function () { return 1; }, // simply count the records
                radiusFunction: function (val) { return Math.min((8 + (val * 4)), 22); },
                mapUnitsPerPixel: _currentMapUnitsPerPixel,
                marginPixels: 1
            };
            var clusteredData = isc.rim.clusterPoints(opts);

            // update observable tells mapsJS to re-render
            _dataKo(clusteredData);
        }
    };


    // unfortunately the USGS geojsonp is non-standard and doesn't allow a jsonp callback parameter 
    // it expects a callback called "eqfeed_callback"
    // we parse their geoJSON into an array of point features with a magnitude
    window.eqfeed_callback = function (d) {

        _data = [];

        var rLen = d.features.length;
        for (var i = 0; i < rLen; i++) {

            var feat = d.features[i];
            var p = feat.geometry.coordinates;
            var mag = feat.properties.mag;
            var place = feat.properties.place;

            if (p && p.length > 1) {
                _data.push(
                {
                    shape: isc.rim.sphericalMercator.projectFromLatLon(new isc.rim.point(p[0], p[1])),
                    magnitude: mag,
                    place: place
                });
            }
        }
        _cluster();
    };
    

    // ajax call to USGS live earthquake feed
    var _fetch = function () {

        var call = $.ajax(_options);
        app.trigger('busy', true);

        call.fail(function (jqXhr, textStatus) {
            app.trigger('error', textStatus);
        });

        call.always(function () {
            app.trigger('busy', false);
        });
    };


    // find the closest earthquake feature to the supplied map point
    var _query = function (pt) {

        if (_data) {

            var feature = null;
            var minD = _currentMapUnitsPerPixel * 10;

            var rLen = _data.length;
            for (var i = 0; i < rLen; i++) {
                var r = _data[i];
                var d = r.shape.distanceTo(pt);
                if (d <= minD) {
                    minD = d;
                    feature = r;
                }
            }

            // publish the identify query result
            if (feature) {
                app.trigger('earthquake:query-result', feature);
            }
        }
    };


    return {
        install: function () {

            // watch for extent change events which result in a potential change in map units per pixel
            // we need this to re-cluster data on scale changes
            app.on('map:extents-change').then(function (e) {

                if (_currentMapUnitsPerPixel != e.mapUnitsPerPixel) {
                    _currentMapUnitsPerPixel = e.mapUnitsPerPixel;
                    _cluster();
                }
            }, _this);

            // watches this message to execute the geojson fetch
            app.on('earthquakes:fetch').then(function (dataKo) {
                _dataKo = dataKo;
                _fetch();
            }, _this);

            // watch this message to change the days-range of the dataset from 1 day to 1 week
            app.on('legend:days').then(function (days) {
                if (days == 1) {
                    _options.url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp';
                }
                else if (days == 7) {
                    _options.url = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojsonp';
                }
                _fetch();
            }, _this);

            // watches this message to execute an identify query
            app.on('map:pointer-click').then(function (pt) {
                _query(pt);
            }, _this);
        },
    };
});