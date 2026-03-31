const fs = require("node:fs/promises");
const { listTsJsFilesPairs } = require("./v3-common");

/* eslint-disable no-console */

async function removeJS() {
  const pairs = await listTsJsFilesPairs();
  for (const { jsFilePath } of pairs) {
    await fs.rm(jsFilePath, { force: true });
  }
  return true;
}

removeJS().then(() => console.log("JS files removed"));
