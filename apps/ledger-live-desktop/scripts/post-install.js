const chalk = require("chalk");
const hasha = require("hasha");
const fs = require("fs");
const child_process = require("child_process");
const path = require("path");

let execa;

const rebuildDeps = async (folder, file) => {
  await execa("npm", ["run", "install-deps"], {
    stdio: "inherit",
    // env: { DEBUG: "electron-builder" },
  });
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

// pnpm does not hoist packages overridden with `link:`, while electron-builder resolves production
// dependencies from node_modules/.pnpm/node_modules: expose each linked package there too.
const hoistLinkedOverrides = () => {
  const root = path.join(__dirname, "..", "..", "..");
  const overrides = require(path.join(root, "package.json")).pnpm?.overrides ?? {};
  for (const [name, spec] of Object.entries(overrides)) {
    if (typeof spec !== "string" || !spec.startsWith("link:")) continue;
    const target = path.resolve(root, spec.slice("link:".length));
    const hoisted = path.join(root, "node_modules", ".pnpm", "node_modules", name);
    fs.mkdirSync(path.dirname(hoisted), { recursive: true });
    fs.rmSync(hoisted, { force: true });
    fs.symlinkSync(target, hoisted);
  }
};

async function main() {
  hoistLinkedOverrides();
  const folder = ".cache/desktop-native-deps/";
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

  const releaseNotes = fs.existsSync("release-notes.json");
  if (!releaseNotes) {
    fs.writeFileSync("release-notes.json", JSON.stringify([], null, 2), "utf-8");
  }
}

main();
