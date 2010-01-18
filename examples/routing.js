// minimum demonstration of a walker with routing capabilities.

require.paths.unshift(require("path").join(__filename, "../../lib"));

// this just the dumbest basicest router you'll ever find.
// works with string, regexp, or function that takes the url
// and returns either the matched portion or false.
// works on the request.url only, but this principle could be
// expanded easily to apply to other parts of the request.
function route (test, chain) {
  var request = this.request, match = "";
  if (typeof(test) === "string") {
    var str = test;
    test = function (url) {
      return url.indexOf(str) === 0 && str;
    };
  } else if (test instanceof RegExp) {
    var reg = test;
    test = function (url) {
      return reg.exec(url)
    };
  }
  return function () {
    var request = this.request,
      match = test(request.url);
    if (!match) return this.next();
    
    // because we're mounting, let's spoof the request.url a little bit for
    // the subsequent things on the chain.  So, if you matched /dog, and the
    // url is /dog/foo/bar, then the links on the chain will just see /foo/bar,
    // as if they were mounted on root.
    var originalUrl = request.url;
    if (!request.originalUrl) request.originalUrl = originalUrl;
    request.url = request.url.substr((Array.isArray(match) ? match[0] : match).length);
    var originalMatch = request.match;
    request.match = match;
    
    // end with a function that cleans up after the routing mutations.
    this
      .unshift(function routeComplete () {
        request.url = originalUrl;
        if (request.originalUrl === originalUrl) delete request.originalUrl;
        if (originalMatch !== undefined) request.match = originalMatch;
        else delete(request.originalMatch);
        this.next();
      })
      .unshift(chain)
      .next();
  };
};

var Walker = require("walker"),
  header = function () { this.sendHeader(200, {"content-type":"text/plain"}).next() },
  hello = function () { this.sendBody("hello").next() },
  space = function () { this.sendBody(", ").next() },
  world = function () { this.sendBody("world").next() },
  print = function () { this.sendBody("\n\n"+this.request.url).next() },
  myChain = [
    header,
    route(/^\/back(wards)?/, [world, space, hello, print]),
    // anything not backwards gets this.  Note that we could also have
    // just had a link that did this.finish() at the end of the chain,
    // but this demonstrates how routes can "fallthrough" to one another,
    // which is useful if a routed chain is not handling the whole request,
    // but just setting something up for later.
    // Also, negative lookaheads are da bomb.
    route(/^(?!\/back(wards)?)/, [hello, space, world, print])
  ];

require("http").createServer(function (req, res) {
  new Walker(req, res).push(myChain).next();
}).listen(8000, "localhost");
