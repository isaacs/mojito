require.paths.unshift(require("path").join(__filename, "../../lib"));
var mojito = require("mojito");

mojito
  ( function () { this.sendHeader(200, {"content-type":"text"}).next() })
  ( function test () { return this.request.url.match(/^\/hello/) },
    function () { this.sendBody("hello").next() })
  ( function test () { return !this.request.url.match(/^\/hello/) },
    function () { this.sendBody("yorp").next() })
  ( function () { this.sendBody(", world") } )
  .listen(8000, "localhost");

mojito
  (function () { this.sendHeader(200, {"content-type":"text/html"}).next() } )
  (/^\/foo/, mojito
    (function () { this.sendBody("foo!").next() })
    (function () { this.finish().done() }))
  (/^\/bar/, mojito
    (function () { this.sendBody("<html><title>bar<p>BAR!<br>").next() }))
  (function () { this.sendBody("not foo").next() })
  (function () { this.finish().done() })
  .listen(8080, "localhost");