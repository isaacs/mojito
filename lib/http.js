// usage: mojito.mixin(require("mojito/http"))(function(){}).listen(8000,"localhost")

exports.listen = listen;
// overwrite the walk.Walker when it's mixed in.
exports.Walker = HTTPWalker;

var mojito = require("./core"),
  aop = require("./aop"),
  walk = require("./walk"),
  Walker = walk.Walker,
  http = require("http");

mojito.requires(exports, walk, aop);

function listen (port, hostname) {
  // create a server and kick off walk() for each request.
  var self = this;
  self.server = http.createServer(function (request, response) {
    self.walk(self, request, response);
  });
  self.server.listen(port, hostname);
  return self;
};

function HTTPWalker (ji, request, response) {
  var self = this;
  Walker.apply(self, ji);
  ["headers", "url", "method", "connection"].forEach(function (f) {
    self[f] = request[f];
  });
  
  self.request = request;
  self.response = response;
  // wrap in a closure here so it's still AOPable.
  self.request.addListener("body", function (b) { return self.receiveBody(b) });
  self.after("done", function () { return self.finish.apply(self, arguments) });
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
["setBodyEncoding", "pause", "resume"].forEach(function (f) {
  HTTPWalker.prototype[f] = function () { this.request[f].apply(this.request, arguments); return this; };
});

