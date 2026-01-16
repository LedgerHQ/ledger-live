const chalk = require("chalk");
const hasha = require("hasha");
const fs = require("fs");
const child_process = require("child_process");
const path = require("path");

let execa;

const rebuildDeps = async (folder, file) => {
  try {
    await execa("npm", ["run", "install-deps"], {
      stdio: "inherit",
      // env: { DEBUG: "electron-builder" },
    });
  } catch (error) {
    // Ignore ENOENT errors for ts-jest in workspace packages (libs/env)
    // electron-builder scans all workspace packages but ts-jest doesn't exist in libs/env
    // (it uses @swc/jest instead). This is safe to ignore as it doesn't affect the app's dependencies.
    const isTsJestWorkspaceError =
      error.message?.includes("ENOENT") &&
      error.message?.includes("ts-jest") &&
      error.message?.includes("libs/env");

    if (isTsJestWorkspaceError) {
      console.log(
        chalk.yellow(
          "Warning: electron-builder tried to access ts-jest in libs/env/node_modules, but it doesn't exist (libs/env uses @swc/jest). This is safe to ignore.",
        ),
      );
      return; // Continue execution - app dependencies may still be rebuilt successfully
    }

    // Re-throw other errors
    throw error;
  }
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
  const folder = ".turbo/cache/";
  const file = "LEDGER_HASH_pnpm-lock.yaml.hash";
  const fullPath = `${folder}${file}`;

  await import("execa").then(mod => {
    execa = mod.execa;
  });

  try {
    const oldChecksum = await fs.promises.readFile(fullPath, { encoding: "utf8" });
    const currentChecksum = await hasha.fromFile(path.join("..", "..", "pnpm-lock.yaml"), {
      algorithm: "md5",
    });
    if (oldChecksum !== currentChecksum) {
      await rebuildDeps(folder, file);
    } else {
      console.log(chalk.blue("checksum are identical, no need to rebuild deps"));
    }
  } catch {
    console.log(
      chalk.blue("no previous checksum saved, will rebuild native deps and save new checksum"),
    );
    try {
      await rebuildDeps(folder, file);
    } catch {
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
