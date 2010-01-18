// usage: mojito.mixin(require("mojito/http"))(function(){...}).listen(8000,"localhost")

// TODO: Get url mounting/branching into its own mojito mixin.

exports.listen = listen;
// overwrite the walk.Walker when it's mixed in.
exports.Walker = HTTPWalker;

var mojito = require("./core"),
  aop = require("./aop"),
  walk = require("./walk"),
  Walker = walk.Walker,
  http = require("http");

mojito.requires(exports, walk, aop);

exports.parseMakeTest = makeTest;

function makeTest (test) {
  // if a function returns a match, and it's at the root of the request.url,
  // then do it like a mounting route
  // where the test function is:
  // if it's a function, just pass it through.
  // regexps get applied to the request.url
  // strings must match the start of request.url
  
  if (typeof(test) === "string") {
    var str = test;
    test = function () { return this.request.url.indexOf(str) === 0 && [str] };
  } else if (test instanceof RegExp) {
    var reg = test;
    test = function () { return reg.exec(this.request.url) };
  }
  
  // called in the context of an HTTPWalker.
  return function () {
    var match = test.call(this);
    
    if (!match) return false;
    
    var str = ""+(match && (match.hasOwnProperty(0) ? match[0] : match));
    
    var originalUrl = this.request.url,
      originalMatch = this.match,
      originalMount = this.mountPoint;
    this.match = match;
    if (originalUrl.indexOf(str) === 0) {
      // url mounting
      this.request.url = this.request.url.substr(str.length);
      this.mountPoint = str;
    }
    
    this.current.action.mo.push({ action : function routeComplete () {
      this.request.url = originalUrl;
      if (originalMount === undefined) delete this.mountPoint;
      else this.mountPoint = originalMount;
      if (originalMatch === undefined) delete this.match;
      else this.match = originalMatch;
      this.next();
    }});
    return true;
  };
};

function listen (port, hostname) {
  // create a server and kick off walk() for each request.
  var self = this;
  self.server = http.createServer(function (request, response) {
    self.walk(request, response);
  });
  self.server.listen(port, hostname);
  return self;
};

function HTTPWalker (ji, request, response) {
  if (!(this instanceof HTTPWalker)) {
    return HTTPWalker.apply(Object.create(HTTPWalker.prototype), arguments);
  }

  var self = this;
  
  Walker.call(self, ji);
  ["headers", "url", "method", "connection"].forEach(function (f) {
    self[f] = request[f];
  });
  
  self.request = request;
  self.response = response;
  // wrap in a closure here so it's still AOPable.
  self.request.addListener("body", function (b) { return self.receiveBody(b) });
  return self;
};

HTTPWalker.prototype = process.mixin(Object.create(Walker.prototype), aop, {
  
  sendHeader : function (statusCode, headers, now) {
    if (this.response.headerSent) return this;
    if (statusCode) this.response.status = statusCode;
    var h = this.response.headers = this.response.headers || {};
    if (headers) process.mixin(h, keysToLowerCase(headers));
    if (now) {
      this.response.headerSent = true;
      this.response.sendHeader(this.response.status||200, h);
    }
    return this;
  },
  sendBody : function (body, encoding) {
    this.sendHeader(false, false, true).response.sendBody(body, encoding);
    return this;
  },
  finish : function () {
    this.response.finish();
    this.finish = function () {};
    this.done();
  },
  // buffer a few, and then give the chain 1s to either pick up the pieces, or drop the cnxn.
  receiveBody : function (data) {
    if (data === null) return;
    var self = this;
    if (!self.readBuffer) self.readBuffer = [];
    if (data) self.readBuffer.push(data);
    if (self.readBuffer.length > 16) {
      self.pause();
      self._timer = setTimeout(function () {
        self.request.connection.close();
        self.done();
      },1000);
    }
    if (self.reader) {
      if (self.readTimer) clearTimeout(self.readTimer);
      self.reader(self.readBuffer.join(""));
      self.readBuffer = [];
    };
    return self;
  },
  readBody : function (reader) {
    if (this.readTimer) clearTimeout(this.readTimer);
    this.receiveBody();
    this.before("reader", reader);
  }
});

// some extra cleanup on Walker.done
aop.after("done", function () { return this.finish.apply(this, arguments) }, HTTPWalker.prototype);

["setBodyEncoding", "pause", "resume"].forEach(function (f) {
  HTTPWalker.prototype[f] = function () { this.request[f].apply(this.request, arguments); return this; };
});

function keysToLowerCase (o) {
  var r = {};
  for (var i in o) r[i.toLowerCase()] = o[i];
  return r;
};