exports.before = before;
exports.after = after;

// Add some functionality to be run before an object method.
// If the method doesn't exist, it will be created.
// Return boolean {false} to cancel the method.
// Return {Array} or {Arguments} to replace the arguments and pass along.
function before (method, action, obj) {
  obj = obj || (this === GLOBAL ? {} : this);
  AopJoiner(obj, method).addBefore(action);
  return obj;
};

// Add some functionality after a method has run.
// If the method doesn't exist, it will be created.
// Previous return value at arguments.callee.aopPreviousReturn.
// Return something other than {undefined} to replace the return value.
function after (method, action, obj) {
  obj = obj || (this === GLOBAL ? {} : this);
  AopJoiner(obj, method).addAfter(action);
  return obj;
};
  

function AopJoiner (obj, method) {
  if (obj[method] && (obj[method] instanceof AopJoiner)) return obj[method];
  
  function joinPoint () {
    var ret = joinPoint.processBefore(this, arguments);
    if (ret === false) return;
    ret = joinPoint.original.apply(this, arr(ret) || arguments);
    return joinPoint.processAfter(this, arguments, ret);
  };
  joinPoint.__proto__ = AopJoiner.prototype;
  joinPoint.original = obj[method];
  joinPoint.before = [];
  joinPoint.after = [];
  joinPoint.toString = function () { return joinPoint.original.toString() };
  obj.__defineGetter__(method, function () { return joinPoint });
  obj.__defineSetter__(method, function (m) { joinPoint.original = m });
  return joinPoint;
};
AopJoiner.prototype = {
  __proto__ : Function.prototype,
  processBefore : function (self, args) {
    var b = this.before;
    for (var i = 0, l = b.length; i < l; i ++) {
      var ret = b[i].apply(self, args);
      if (ret === false) return ret;
      args = arr(ret) || args;
    }
    return ret;
  },
  processAfter : function (self, args, prev) {
    var a = this.after;
    for (var i = 0, l = a.length; i < l; i ++) {
      var ret = a[i].aopPreviousReturn = prev;
      var afterRet = a[i].apply(self, args);
      delete a[i].aopPreviousReturn;
      prev = (afterRet === undefined ? ret : afterRet);
    }
    return prev;
  },
  addBefore : function (action) {
    this.before.unshift(action);
  },
  addAfter : function (action) {
    this.after.push(action);
  }
};

var emptyFunction = function () {};

function arr (a) {
  if (
    Object.prototype.toString.call(a) === "[Object Arguments]"
  ) return Array.prototype.slice.call(a,0);
  if (Array.isArray(a)) return a;
}