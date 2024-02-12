const fs = require("fs");
const path = require("path");

// Copy a folder and its contents recursively.
function copyFolderRecursivelySync(source, target, options = {}) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true, ...options });
  }

  if (fs.statSync(source).isDirectory()) {
    const files = fs.readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (fs.statSync(curSource).isDirectory()) {
        copyFolderRecursivelySync(curSource, path.join(target, file));
      } else {
        fs.copyFileSync(curSource, path.join(target, path.basename(file)));
      }
    });
  }
}

module.exports = ({ patterns, options = {} }) => {
  return {
    name: "Copy",
    setup(build) {
      build.onEnd(({ errors }) => {
        if (errors.length && !options.skipOnError) {
          return;
        }

        const targetBase =
          build.initialOptions.outdir || path.dirname(build.initialOptions.outfile);

        patterns.forEach(({ from, to }) => {
          copyFolderRecursivelySync(from, path.join(targetBase, to), options);
        });
      });
    },
  };
};
