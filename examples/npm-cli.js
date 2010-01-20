
// NB: This doesn't work.  It's a sketch of where I'd like to go.

var mo = require("mojito").mixin("mojito/cli"),
  path = require("path"),
  url = require("url"),
  npm = require("npm");

// say we did "npm install foo"
// we could save this file as "npm" with #!env node, and this should work.
mo("npm") // define the default top-level program name.
  .rcfile(path.join(process.ENV.HOME, ".npmrc")) // read the configs from the file
  .option("help", "h", function (m) { m.action = "help"; m.next() })
  ("help", mo.usage)
  .option("registry", "r", mo.config()) // save the next word as a config option, allowing anything.
  .option("force", "f", function (m) { m.force = true; m.next() })
  .option("root", "/", mo.config(
  ("install", mo
    .option("version", "v", mo.config(/^[a-z0-9\.]+$/)) // save as the "version" option
    .option("branch", "b", mo.config(/^stable|edge|nightly$/, "stable"))
    .option("target", "t", mo.config(/^[\w_-]+$/))
    (/[\w_-]+/, mo // the thing to install.  look it up, and then install it.
      (function (m, match) {
        // first check if this thing is a url or a file that exists.
        var u = url.parse(match[0]);
        if (!u.protocol) path.exists(match[0], function (exists) {
          if (exists) m.tarball = match[0];
          else m.package = match[0];
          m.next();
        });
        else {
          // it's a url
          m.url = url.format(match[0]);
          m.next();
        }
      })
      // at this point we have either a tarball, a url, or just a name.
      (function (m) {
        if (m.tarball || m.url) m.next(); // no need to look up.
        // look up from the registry.
        if (!m.registry) throw new Error(
          "Can't install.  Either provide a registry url, or a url/path to a tarball to install."
        );
        if (!m.target) m.target = m.packageName;
        m.url = npm.registryUrl({
          registry : m.registry,
          version : m.version,
          package : m.package
        });
        if (!m.url) throw new Error(
          "Couldn't get registry url."
        );
        m.next();
      })
      (function (m) {
        npm.install(m.url || m.tarball, m.target, {
          version : m.version,
          force : m.force,
          branch : m.branch,
        })
          .addCallback(function () { m.success() })
          .addErrback(function (e) { throw e });
      }))
    .noMatch(function (m, word) { throw new Error("Invalid thing to install: "+ word) })) // end install
  ("remove", mo
    (/[\w_-]+/, function (m, match) {
      npm.remove(match[0], { force : m.force })
        .addCallback(function () { m.success() })
        .addErrback(function (e) { throw e });
    })
    .noMatch(function (m, word) { throw new Error("Invalid thing to remove: "+ word) })) // end remove
  .noMatch(function (m, word) { throw new Error("Unknown command: "+word) })
  .run(process.ENV.ARGV); // run it, passing in the arguments.