var mojito = require("mojito");

mojito
  (function (w) {
    var message = "hello, world";
    w
      .sendHeader(200, {"content-type":"text/plain", "content-length":message.length})
      .sendBody(message)
      .done();
  })
  .listen(8000, "localhost");

// require("http").createServer(function (req,res) {
//   var message = "hello, world";
//   res.sendHeader(200, {"content-type":"text/plain", "content-length":message.length});
//   res.sendBody(message);
//   res.finish();
// }).listen(8000, "localhost")


// mojito
//   ( function () { this.sendHeader(200, {"content-type":"text"}).next() })
//   ( /^\/hello/, function () { this.sendBody("hello").next() })
//   ( { test : /^(?!\/hello)/,
//     action : function () { this.sendBody("yorp").next() } })
//   ( function () { this.sendBody(", world").next() } )
//   ( function () { this.done() } )
//   .listen(8000, "localhost");

// mojito
//   (function () { this.sendHeader(200, {"content-type":"text/html"}).next() } )
//   (/^\/foo/, mojito
//     (function () { this.sendBody("foo!").next() })
//     (function () { this.done() }))
//   (/^\/bar/, mojito
//     (function () { this.sendBody("<html><title>bar<p>BAR!<br>").next() }))
//   (function () { this.sendBody("not foo").next() })
//   (function () { this.finish() })
//   .listen(8080, "localhost");
