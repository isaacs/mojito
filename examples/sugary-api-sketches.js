
//         /(B)---------------
// --(A)--*        /(D)--|    \
//         \(C)---*            --(G)--(H)
//                 \(E)--(F)--/

mojito
  (A)
  ("/B", B) // single link, then fallthrough, no wrapper necessary
  ("/C", mojito
    (C)
    ("/D", mojito(D)()) // terminus
    ("/E", mojito(E)(F)))
  (G)
  (H)
  ().listen(8000);


// irl, these links would probably be defined in their own modules or something.
// but you CAN do it inline, since it's just functions getting tossed about.
mojito
  // a setup function that adds a fun header.
  // Note that this is JUST a setup function, no traceback, no walk link.
  (function setup () {
    this.addHeader(null, {
      "The-Answer" : "42",
      "X-Powered-By" : "mojito"
    });
  })
  // An error handler.  Uses "before" to trap the error and handle it nicely.
  // Also just a bare setup function.
  (function setup () {
    this.before("error", function (e) {
      this
        .sendHeader(500, {}, true)
        .sendBody("<doctype html><title>Oops!</title>")
        .sendBody("<p>A bad thing happened. Here's the stack trace:</p>")
        .sendBody("<pre>"+e.stack+"</pre>")
        .finish();
      // return boolean "false" to prevent the default error behavior.
      return false;
    });
  })
  // a streaming gzip thing
  (function gzipper (req, res) {
    // if they don't accept gzip, then skip over this link doing nothing.
    if (req.header("accept").indexOf("gzip") === -1) return this.next();
    
    // whenever the headers are sent, make sure that we're not
    // setting a content-length, since it'll be invalid,
    // and that the content-type is gzip
    this
      .after("sendHeader", function (code, header) {
        this
          .deleteHeaderField("content-length")
          // should this perhaps be "multipart/x-gzip" instead?
          .setHeaderField("content-type", "application/x-gzip")
      })
      .before("sendBody", function (chunk, encoding) {
        this.response.sendBody(theGzipEncodingFunction(chunk), "binary");
        return false;
      });
  })
  ("/foo", mojito(fooApp)())
  (/^\/blog\/?/, mojito(funkyBlogApp)())
  (/^\/static\//, mojito
    (farFutureExpiresHeader)
    (/^js\/(.*)\.js$/, mojito
      (javascriptHeaders)
      (jsmin))
    (/^css\/(.*)\.css$/, mojito
      (cssHeaders)
      (cssmin)))
  (directoryIndex)
  (fileServer)
  ()
  .listen(8000); // this starts the server.

// NOTE: These examples below show that there is a need for SOME kind of state
// to be handled by the Walker.  I don't love the code below, and the API
// definitely needs to be cleaned up a lot.

// check to make sure that the user is authenticated, and if not, make them log in.
mojito
  (loadSession)
  (checkAuth)
  (function test (req) { return req.isAuthed }, mojito(loginPage)())
  (myAppMain)
  ().listen(80);

mojito
  (loadDataModel)
  (function test (req) {
    // if it's a JSONRequest, then serve up json.
    return req.header("accept").indexOf("application/json") !== -1
  }, mojito(renderAsJSON)()) // terminal, and end route
  (function test (req) {
    // jsonp, serve up with a callback.
    return req.query.callback || req.query.format === "json";
  }, mojito(renderAsJSONP)())
  (renderAsTemplate)
  ().listen(8000);

