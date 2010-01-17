module.exports = ChainWalker;

var REGISTRY = {};
function ChainWalker (req, res) {
  // tamper-evident seal around private members.
  for (var key = Math.random(); key in REGISTRY; key = Math.random());
  this._id = key;
  this.request = req;
  REGISTRY[key] = 
    { response : res
    , cw : this
    , walked : []
    , links : []
    , current : null
    };
};

ChainWalker.prototype = {
  // finish the request and terminate the chain.
  // TODO: Should finishing the request be the same as ending the chain?
  // I'm not completely convinced of that.
  // Not chainable, because this *should* always be the last thing in a function.
  finish : function () {
    var p = priv(this);
    p.response.finish();
    this.isFinished = true;
    // todo: walkback over p.walked
    delete REGISTRY[this._id]
  },
  
  // go to the next link in the chain.
  // Not chainable, because this *should* always be the last thing in a function.
  next : function () {
    var self = this,
      p = priv(self);
    
    // should this throw, clear the timeout, queue the links, or be a no-op?
    // throwing is the easiest, so I'll do that for now.  If it's an edge case
    // people care about, can always revisit.
    if (p.timeout) throw new Error(
      "Called next() multiple times in the same link."
    );
    var nextLink = self.shift();
    // if there's a nextLink, then schedule it.
    // otherwise, finish up.
    if (!nextLink) return self.finish();
    
    p.timeout = setTimeout(function () {
      p.current = nextLink;
      p.walked.push(nextLink);
      delete(p.timeout);
      nextLink.call(self);
    });
  },
  
  // proxies to the response obj, and prettied up a little bit.
  sendBody : function (body, encoding) {
    var p = priv(this);
    if (!this.headerSent) this.sendHeader(false, false, true);
    if (this.request.method !== "HEAD") p.response.sendBody(String(body), encoding || "binary");
    return this;
  },
  sendHeader : function (status, header, now) {
    var p = priv(this);
    if (this.headerSent) return this;
    if (status) this.status = status;
    if (!this.header) this.header = {};
    if (header) process.mixin(
      this.header, keysToLowerCase(header)
    );
    if (now) {
      this.headerSent = true;
      p.response.sendHeader(this.status || 200, this.header || {});
    }
    
    return this;
  },
  flush : function () { priv(this).response.flush(); return this; },
  
  // get a copy of the links array.  Note that pushing onto it won't do
  // anything.  I want to make sure that push/pop/shift/unshift will
  // go through my channel, so that I can flatten arrays.
  // This is a read-only view of what's on the agenda.
  links : function () { return priv(this).links.slice(0) }
};

["shift", "pop"].forEach(function (f) {
  ChainWalker.prototype[f] = function () {
    var c = priv(this).links;
    return c[f].call(c);
  };
});
["unshift", "push"].forEach(function (f) {
  ChainWalker.prototype[f] = function () {
    var c = priv(this).links;
    c[f].apply(c, flatten(Array.prototype.slice.call(arguments, 0)));
    return this;
  };
});
function priv (cw) {
  var p = REGISTRY[cw._id];
  if (!p || (p.cw !== cw)) throw new Error(
    "Invalid ChainWalker: " + cw._id + ". Maybe calling next() after finish()?"
  );
  return p;
}

// take nested arrays, return a DFS flattened array.
function flatten (arr) {
  if (!Array.isArray(arr)) return [arr];
  for (var i = 0, l = arr.length, ret = []; i < l; i ++) {
    ret.push.apply(ret, flatten(arr[i]));
  }
  return ret;
}

function keysToLowerCase (obj) {
  var out = {};
  for (var i in obj) out[i.toLowerCase] = obj[i];
  return out;
}
