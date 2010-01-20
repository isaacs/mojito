
var mo = require("mojito").mixin("mojito/cli"),
  sys = require("sys");

mo
  (function () { process.stdio.writeError("hello, "); m.next() })
  (/^world$/, function (m, match) { process.stdio.write(match[0]); m.next() })
  (/isaac|person/i, function (m, match) { process.stdio.write(match[0]); m.next() })
  .noMatch(function (m, word) { process.stdio.write(word); process.stdio.write("\nNice to meet you!"); m.next() })
  .run(process.ENV.ARGV);