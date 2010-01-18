
var mojito = require("./core");

(exports.parse = parse).makeTest = makeTest;
mojito.requires(exports, require("./aop"));

exports.mojitoMixin = function () {
  this.before("push", function (args) {
    // return a new arguments array with a single member that is the parsed version,
    // or false to cancel the addition.
    var a = this.parse(args);
    return a ? [a] : false;
  }, 
};

// just a placeholder for some kind of domain-specific walker to hijack.
function makeTest (test) { return function () { return true } };

function parse (args) {
  var out = {}, skipped = 0;
  for (var i = 0, l = args.length; i < l; i ++) {
    // test members for routing.
    var part = args[i];
    if (
      part && typeof(part) === "object" &&
      (("action" in part) || ("test" in part))
    ) {
      process.mixin(out, part);
    } else if (
      typeof(part) === "string"
      || part instanceof RegExp
    ) {
      out.test = this.parse.makeTest(part);
    } else if (typeof(part) === "function") {
      if (part.name === "test") {
        out.test = part;
      } else {
        // either an action or another mojito chain.
        // either way, walkers should be able to sort it out.
        out.action = part;
      }
    } else {
      skipped ++;
    }
  }
  return (skipped === args.length) ? false : obj;
};