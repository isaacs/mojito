
exports.walk = walk;
exports.Walker = Walker;

var mojito = require("./core");

mojito.requires(exports, require("./parse"));

function walk () {
  return this.Walker.apply(null, [this].concat(Array.prototype.slice.call(arguments,0))).next();
};

function Walker (ji) {
  if (!(this instanceof Walker)) {
    return Walker.apply(Object.create(Walker.prototype), arguments);
  }
  if (ji === mojito) throw new Error(
    "Cannot walk global mojito object."
  );
  if (!mojito.isMojito(ji)) ji = mojito(ji);
  this.stack = [];
  this.ji = ji;
  this.index = -1;
};

Walker.prototype = {
  next : function () {
    this.index ++;
    var current = this.ji.mo[this.index];
    if (!current) {
      // fell off the path.  call done if this was the top, or pop the stack.
      var prev = this.stack.pop();
      if (!prev) return this.done();
      this.index = prev.index;
      this.ji = prev.ji;
      return this.next();
    }
    if (current.test && !current.test.call(this)) return this.next();
    if (mojito.isMojito(current.action)) {
      // walk down that path
      this.stack.push({index:this.index,ji:this.ji});
      this.index = -1;
      this.ji = current.action;
      return this.next();
    }
    // at this point, it's an actual action worth taking.
    var self = this;
    setTimeout(function () { self.step(current.action) });
  },
  
  done : function () {
    this.stack = [];
    this.index = this.ji.mo.length;
  },
  step : function (action) { return action.apply(this) }
};
