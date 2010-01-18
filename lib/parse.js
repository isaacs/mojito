
var mojito = require("./core");

mojito.requires(exports, require("./aop"));
exports.parse = parse;
exports.parseMakeTest = makeTest;

exports.mojitoMixin = function parse_mojitoMixin () {
  this.__proto__.before("push", function (args) {
    // return a new arguments array with a single member that is the parsed version,
    // or false to cancel the addition.
    var a = this.parse(args);
    return a ? [a] : false;
  });
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
      if (out.test && typeof(out.test) !== "function") out.test = this.parse.makeTest(out.test);
    } else if (
      typeof(part) === "string"
      || part instanceof RegExp
    ) {
      out.test = part;
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
  if (!out.action || skipped === args.length) return false;
  
  if (out.test) {
    out.test = this.parseMakeTest(out.test);
    if (!mojito.isMojito(out.action)) out.action = mojito(out.action);
  }
  return out;
};