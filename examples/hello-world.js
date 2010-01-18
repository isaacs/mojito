// minimum demonstration of a walker.

require.paths.unshift(require("path").join(__filename, "../../lib"));

var Walker = require("walker"),
  ingredients = [
    function () { this.sendHeader(200, {"content-type":"text/plain"}).next() },
    function () { this.sendBody("hello, world").next() },
    function () { this.finish() }
  ];

require("http").createServer(function (req, res) {
  new Walker(req, res).push(ingredients).next();
}).listen(8000, "localhost");
