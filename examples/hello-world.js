// minimum demonstration of a chain walker.

require.paths.unshift(require("path").join(__filename, "../../lib"));

var ChainWalker = require("chain-walker"),
  myChain = [
    function () { this.sendHeader(200, {"content-type":"text/plain"}).next() },
    function () { this.sendBody("hello, world").next() },
    function () { this.finish() }
  ];

require("http").createServer(function (req, res) {
  new ChainWalker(req, res).push(myChain).next();
}).listen(8000, "localhost");
