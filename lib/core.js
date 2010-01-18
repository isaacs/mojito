module.exports = mojito;

function mojito () {
  var mo = [];
  function ji () {
    ji.push(arguments);
    return ji;
  };
  ji.__proto__ = {
    __proto__:to,
    push : function () { mo.push.apply(mo, arguments); return this; },
    get mo : function () { return mo },
    set mo : function (i) {
      if (!Array.isArray(i)) throw new Error("Not an array.");
      return mo = i;
    },
  };
  return ji.apply(this, arguments);
};
mojito.__proto__ = to;
var to = {
  __proto__ : Function.prototype,
  // add functionality.
  // mojito.mixin() is global, and affects all walkers.
  // mojito(stuff).mixin() only affects that path.
  mixin : function (module) {
    var p = this.__proto__,
      hasMixin = p.hasMixin;
    if (hasMixin(module)) return this;
    p.hasMixin = function (m) { return (m === module) || hasMixin(m) });
    if (module.mojitoRequires___) {
      module.mojitoRequires___.forEach(this.mixin, this);
    }
    if (typeof module.mojitoMixin === "function") {
      if (module.mojitoMixin.apply(this) === false) return this;
    }
    process.mixin(p, module);
    delete p.mojitoMixin;
    return this;
  },
  hasMixin : returnFalse,
  seal : function () { this.isSealed = this.hasMixin = returnTrue; return this; }
};
mojito.requires = function (module) {
  module.mojitoRequires___ = Array.prototype.slice.call(arguments,1);
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
