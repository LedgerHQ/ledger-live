const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ensureDirectoryExistence = filePath => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

module.exports = (
  options = {
    // onResolve file filter
    regexp: /\.(json)$/,
    // check if the imported file include this regexp / string
    folderFilter: "",
    // where the files will be copied
    targetPathPrefix: "",
    // what the import path should look like
    pathPrefix: "",
  },
) => {
  return {
    name: "json-plugin",
    setup(build) {
      build.onResolve({ filter: options.regexp }, args => {
        if (args.resolveDir.includes(options.folderFilter)) {
          const sourcePath = path.resolve(args.resolveDir, args.path);
          const fileContent = fs.readFileSync(sourcePath);

          const hash = crypto.createHash("sha1").update(fileContent).digest("hex");

          const fileName = `${hash}-${path.basename(args.path)}`;
          const targetPath = path.join(options.targetPathPrefix, fileName);

          ensureDirectoryExistence(targetPath);
          fs.copyFileSync(sourcePath, targetPath);
          return {
            path: `${options.pathPrefix}/${fileName}`,
            external: true,
          };
        }

        return undefined;
      });
    },
  };
};
