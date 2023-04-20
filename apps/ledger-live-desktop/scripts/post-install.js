const chalk = require("chalk");
const hasha = require("hasha");
const execa = require("execa");
const fs = require("fs");
const child_process = require("child_process");
const path = require("path");

const rebuildDeps = async (folder, file) => {
  await execa("npm", ["run", "install-deps"], {
    // env: { DEBUG: "electron-builder" },
  }).stdout.pipe(process.stdout);
  const checksum = await hasha.fromFile(path.join("..", "..", "pnpm-lock.yaml"), {
    algorithm: "md5",
  });
  console.log(chalk.blue("creating a new file with checksum"));
  if (fs.existsSync(folder)) {
    await fs.promises.writeFile(`${folder}${file}`, checksum);
  } else {
    await fs.promises.mkdir(folder, { recursive: true });
    await fs.promises.writeFile(`${folder}${file}`, checksum);
  }
  console.log(chalk.blue("file created"));
};

async function main() {
  const folder = "node_modules/.cache/";
  const file = "LEDGER_HASH_pnpm-lock.yaml.hash";
  const fullPath = `${folder}${file}`;

  try {
    const oldChecksum = await fs.promises.readFile(fullPath, { encoding: "utf8" });
    const currentChecksum = await hasha.fromFile(path.join("..", "..", "pnpm-lock.yaml"), {
      algorithm: "md5",
    });
    if (oldChecksum !== currentChecksum) {
      rebuildDeps(folder, file);
    } else {
      console.log(chalk.blue("checksum are identical, no need to rebuild deps"));
    }
  } catch (error) {
    console.log(
      chalk.blue("no previous checksum saved, will rebuild native deps and save new checksum"),
    );
    try {
      await rebuildDeps(folder, file);
    } catch (error) {
      console.log(chalk.red("rebuilding error"));
    }
  }

  // when running inside the test electron container, there is no src.
  if (fs.existsSync("src")) {
    child_process.exec("zx ./scripts/sync-families-dispatch.mjs");
  }

  const releaseNotes = fs.existsSync("release-notes.json");
  if (!releaseNotes) {
    fs.writeFileSync("release-notes.json", JSON.stringify([], null, 2), "utf-8");
  }
}

main();
