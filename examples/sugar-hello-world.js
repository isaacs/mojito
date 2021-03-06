var mojito = require("mojito");

// mojito
//   (function (w) {
//     var message = "hello, world";
//     w
//       .sendHeader(200, {"content-type":"text/plain", "content-length":message.length})
//       .sendBody(message)
//       .done();
//   })
//   .listen(8000, "localhost");

// require("http").createServer(function (req,res) {
//   var message = "hello, world";
//   res.sendHeader(200, {"content-type":"text/plain", "content-length":message.length});
//   res.sendBody(message);
//   res.finish();
// }).listen(8000, "localhost")


mojito
  ( function (w) { w.sendHeader(200, {"content-type":"text"}).next() })
  ( /^\/hello/, function (w) { w.sendBody("hello").next() })
  ( { test : /^(?!\/hello)/,
    action : function (w) { w.sendBody("yorp").next() } })
  ( function (w) { w.sendBody(", world").next() } )
  ( function (w) { w.done() } )
  .listen(8000, "localhost");

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
