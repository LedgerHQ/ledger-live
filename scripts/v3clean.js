const { rm } = require("fs");

const exec = require("child_process").exec;

/* eslint-disable no-console */

async function executeAsync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else if (stderr) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function listTsJsFilesPairs() {
  const jsFilesPath = {};
  const jsTsPairs = [];
  await executeAsync('git ls-files | grep -e ".\\.js$"').then(res =>
    res.split("\n").map(path => (jsFilesPath[path] = true)),
  );
  return executeAsync('git ls-files | grep -e ".\\.ts$" -e ".\\.tsx$"')
    .then(res =>
      res.split("\n").forEach(path => {
        const beforeExtensionPath = path
          .split(".")
          .slice(0, -1)
          .join(".");
        const jsFilePath = `${beforeExtensionPath}.js`;
        if (jsFilesPath[jsFilePath]) {
          jsTsPairs.push({
            tsFilePath: path,
            jsFilePath,
          });
        }
      }),
    )
    .then(() => jsTsPairs);
}

async function removeJS() {
  const pairs = await listTsJsFilesPairs();

  pairs.forEach(({ jsFilePath }) => {
    rm(jsFilePath);
  });

  return true;
}

removeJS().then(() => console.log("JS files removed"));
