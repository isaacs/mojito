module.exports = mojito;

function mojito () {
  var mo = [];
  function ji () {
    if (arguments.length) ji.push(arguments);
    return ji;
  };
  ji.mo = mo;
  ji.__proto__ = { __proto__:to };
  return ji.apply(this, arguments);
};
var to = mojito.__proto__ = {
  __proto__ : Function.prototype,
  
  push : function () {
    if (!this.mo) return;
    this.mo.push.apply(this.mo, arguments);
    return this;
  },
  
  // add functionality.
  mixin : function (mint) {
    var p = this.__proto__,
      hasMixin = p.hasMixin;
    if (hasMixin(mint)) return this;
    p.hasMixin = function (m) { return (m === mint) || hasMixin(m) };
    if (mint.mojitoRequires___) {
      mint.mojitoRequires___.forEach(this.mixin, this);
    }
    if (typeof mint.mojitoMixin === "function") {
      if (mint.mojitoMixin.apply(this) === false) return this;
    }
    process.mixin(p, mint);
    delete p.mojitoMixin;
    return this;
  },
  hasMixin : returnFalse,
  seal : function () { this.isSealed = this.hasMixin = returnTrue; return this; }
};

mojito.requires = function (mint) {
  mint.mojitoRequires___ = Array.prototype.slice.call(arguments,1);
  return mint;
};

mojito.isMojito = function (thing) {
  return (
    typeof(thing) === "function"
    && (
      thing.name === "ji" && thing.__proto__.__proto__ === to
      || thing === mojito
    ));
};

function returnFalse () { return false };
function returnTrue () { return true };


