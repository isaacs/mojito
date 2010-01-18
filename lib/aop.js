exports.before = before;
exports.after = after;

// Add some functionality to be run before an object method.
// If the method doesn't exist, it will be created.
// Return boolean false to cancel the method.
// Return {Array} or {Arguments} to replace the arguments and pass along.
function before (method, action, obj) {
  obj = obj || (this === GLOBAL ? {} : this);
  var original = obj[method] || function () {};
  obj[method] = function () {
    var ret = action.apply(this, arguments);
    if (ret === false) return;
    return original.apply(this, arr(ret) || arguments);
  };
  return obj;
};

// Add some functionality after a method has run.
// If the method doesn't exist, it will be created.
// Previous return value at arguments.callee.aopPreviousReturn.
// Return something other than {undefined} to replace the return value.
function after (method, action, obj) {
  obj = obj || (this === GLOBAL ? {} : this);
  var original = obj[method] || function () {};
  obj[method] = function () {
    var ret = action.aopPreviousReturn = original.apply(this, arguments);
    var afterRet = action.apply(this, arguments);
    return (afterRet !== undefined) ? afterRet : ret;
  };
  return obj;
};

function arr (a) {
  if (
    Object.prototype.toString.call(a) === "[Object Arguments]"
  ) return Array.prototype.slice.call(a,0);
  if (Array.isArray(a)) return a;
}