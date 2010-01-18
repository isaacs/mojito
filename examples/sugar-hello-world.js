var mojito = require("./../lib/mojito");

mojito
  ( function () { this.sendHeader(200, {"content-type":"text"}).next() })
  ( /^\/hello/, function () { this.sendBody("hello").next() })
  ( { test : /^(?!\/hello)/,
    action : function () { this.sendBody("yorp").next() } })
  ( function () { this.sendBody(", world").next() } )
  ( function () { this.done() } )
  .listen(8000, "localhost");

mojito
  (function () { this.sendHeader(200, {"content-type":"text/html"}).next() } )
  (/^\/foo/, mojito
    (function () { this.sendBody("foo!").next() })
    (function () { this.done() }))
  (/^\/bar/, mojito
    (function () { this.sendBody("<html><title>bar<p>BAR!<br>").next() }))
  (function () { this.sendBody("not foo").next() })
  (function () { this.finish() })
  .listen(8080, "localhost");