#!/usr/bin/env zx
import "zx/globals";
import { createHash } from "crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

function computeMetaHash(paths, inputHash) {
  const hash = inputHash ? inputHash : createHash("sha1");
  for (const path of paths) {
    const statInfo = statSync(path);
    if (statInfo.isDirectory()) {
      const directoryEntries = readdirSync(path, { withFileTypes: true });
      const fullPaths = directoryEntries.map(e => join(path, e.name));
      // recursively walk sub-folders
      computeMetaHash(fullPaths, hash);
    } else {
      const statInfo = statSync(path);
      // compute hash string name:size:mtime
      const fileInfo = `${path}:${statInfo.size}:${statInfo.mtimeMs}`;
      hash.update(fileInfo);
    }
  }
  // if not being called recursively, get the digest and return it as the hash result
  if (!inputHash) {
    return hash.digest().toString("base64");
  }
  return;
}

function compareHashes(cacheFile = {}, current = {}) {
  if (!cacheFile || !current) return false;
  return (
    cacheFile.lock === current.lock &&
    cacheFile.podsHash === current.podsHash &&
    cacheFile.pkg === current.pkg
  );
}

function getCache(path) {
  const exists = existsSync(path);

  if (exists) {
    const file = readFileSync(path);
    const json = JSON.parse(file);
    return json;
  }

  return null;
}

function runHashChecks(writeCache = false) {
  const pods = join(__dirname, "..", "ios", "Pods");
  const lock = join(__dirname, "..", "ios", "Podfile.lock");
  const pkg = join(__dirname, "..", "package.json");

  if (!existsSync(pods)) return false;

  const podsHash = computeMetaHash([pods]);
  const lockHash = computeMetaHash([lock]);
  const packageHash = computeMetaHash([pkg]);
  const cachePath = join(__dirname, "..", "ios", ".podhash.json");

  const result = {
    lock: lockHash,
    pod: podsHash,
    pkg: packageHash,
  };

  const cache = getCache(cachePath);

  if (!cache || writeCache) {
    try {
      const data = JSON.stringify(result);
      writeFileSync(cachePath, data);
    } catch (error) {
      echo(chal.red(error));
      return false;
    }

    return false;
  }

  return compareHashes(cache, result);
}

$.verbose = true; // everything works like in v7

if (os.platform() === "win32") {
  usePowerShell();
}

cd(path.join(__dirname, ".."));

const syncFamilies = async () => await $`zx ./scripts/sync-families-dispatch.mjs`;

const final = async () => {
  // Create the dev .env file with APP_NAME if it doesn't exist
  const exists = existsSync(".env");
  if (!exists) {
    const str = `APP_NAME="LL [DEV]"
ANALYTICS_TOKEN=ICid4O5K4AE2Utbv1ZT5CLmZalVWz8V9
BRAZE_ANDROID_API_KEY="4ef07be0-a4ea-4f73-81a9-760e473959f3"
BRAZE_IOS_API_KEY="c8445d15-340f-4689-8524-4c01aa468a8b"
BRAZE_CUSTOM_ENDPOINT="sdk.fra-02.braze.eu"`;
    await fs.promises.writeFile(".env", str, "utf8");
  }

  if (os.platform() === "darwin") {
    try {
      await which("bundle");
      try {
        await $`bundle install`;
      } catch (error) {
        echo(chalk.red(error));
      }
    } catch (error) {
      echo(
        chalk.red("Error: `bundle` command is missing. Please install Bundler. https://bundler.io"),
      );
    }
  }

  let hashesAreEquals = false;
  try {
    hashesAreEquals = runHashChecks();
    if (hashesAreEquals) {
      echo(chalk.green("Pods hashes are equal, skipping Pods install"));
    } else {
      echo(chalk.yellow("Pods hashes are not in sync, installing Pods"));
    }
  } catch (error) {
    echo(chalk.red(error));
  }

  if (os.platform() === "darwin" && !process.env["SKIP_BUNDLE_CHECK"] && !hashesAreEquals) {
    cd("ios");
    try {
      await $`bundle exec pod install --deployment --repo-update --verbose`;
      try {
        runHashChecks(true);
      } catch (error) {
        echo(chalk.red(error));
      }
    } catch (error) {
      const str = `
        ________________________________________
        / CocoaPods lockfile is probably out of  \\
        | sync with native dependencies. Don't   |
        | forget to run \`pnpm mobile pod\` after  |
        | adding or updating dependencies, and   |
        \\ commit the changes in Podfile.lock.    /
         ----------------------------------------
          \\
           \\
             __
            /  \\
            |  |
            @  @
            |  |
            || |/
            || ||
            |\\_/|
            \\___/
        `;
      echo(chalk.red(str));

      if (process.env.CI) {
        const output = process.env["GITHUB_OUTPUT"];
        const data = `error<<GHA_OUTPUT_DELIMITER\n${str}\nGHA_OUTPUT_DELIMITER\n`;
        writeFileSync(output, data);
        echo(chalk.red("Error available in step output.error"));
      }

      await $`exit 1`;
    }
  }
};

await syncFamilies();
await final();
