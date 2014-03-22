var http = require('http');
var fs = require('fs');
var path = require('path');
var mkpath = require('mkpath');

var NG_PAGES = require(__dirname + '/../config/docData.js').NG_PAGES;

for (key in NG_PAGES) {
    if (NG_PAGES.hasOwnProperty(key)) {
        (function(key) {

            var curDocInfo = NG_PAGES[key];

            var request = http.get('http://code.angularjs.org/1.2.14/docs/' + curDocInfo.outputPath, function(response) {

                mkpath(path.dirname(curDocInfo.outputPath), function(err) {
                    var file = fs.createWriteStream(__dirname + '/' + curDocInfo.outputPath);
                    response.pipe(file);
                });


            });

        })(key);
    }
}
