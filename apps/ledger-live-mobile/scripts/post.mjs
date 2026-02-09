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
  // Had to remove the following because we already have the AsyncSocket lib as a dependency from Flipper 🐬
  // Why would anyone bundle an external lib available on CocoaPods anyway?
  // It's been fixed in https://github.com/tradle/react-native-udp/pull/112 but as of today it's not part of any release
  // See: https://github.com/Rapsssito/react-native-tcp-socket/issues/61#issuecomment-904842949
  await fs.promises.rm("node_modules/react-native-tcp/ios/CocoaAsyncSocket", {
    force: true,
    recursive: true,
  });

  const dotLottieViewManagerPath = join(
    "node_modules",
    "@lottiefiles",
    "dotlottie-react-native",
    "ios",
    "DotlottieReactNativeViewManager.swift",
  );
  if (existsSync(dotLottieViewManagerPath)) {
    const contents = readFileSync(dotLottieViewManagerPath, "utf8");
    const legacyCall = "stateMachineUnSubscribe(observer: stateMachineObserver)";
    const fixedCall = "stateMachineUnsubscribe(stateMachineObserver)";

    if (contents.includes(legacyCall)) {
      const updated = contents.replace(legacyCall, fixedCall);
      writeFileSync(dotLottieViewManagerPath, updated, "utf8");
    } else if (!contents.includes(fixedCall)) {
      const message =
        "DotLottie patch failed: expected stateMachineUnSubscribe call not found. " +
        "Please update the postinstall patch for dotlottie-react-native.";
      echo(chalk.red(message));
      throw new Error(message);
    }
  }

  const dotLottieAndroidFiles = [
    join(
      "node_modules",
      "@lottiefiles",
      "dotlottie-react-native",
      "android",
      "src",
      "main",
      "java",
      "com",
      "dotlottiereactnative",
      "DotlottieReactNativePackage.kt",
    ),
    join(
      "node_modules",
      "@lottiefiles",
      "dotlottie-react-native",
      "android",
      "src",
      "main",
      "java",
      "com",
      "dotlottiereactnative",
      "DotlottieReactNativeViewManager.kt",
    ),
  ];

  const interopImportRegex =
    /^import com\.facebook\.react\.common\.annotations\.internal\.InteropLegacyArchitecture\r?\n/m;
  const interopAnnotationRegex = /^@InteropLegacyArchitecture\r?\n/m;

  for (const filePath of dotLottieAndroidFiles) {
    if (!existsSync(filePath)) continue;

    const contents = readFileSync(filePath, "utf8");
    const updated = contents.replace(interopImportRegex, "").replace(interopAnnotationRegex, "");

    if (updated !== contents) {
      writeFileSync(filePath, updated, "utf8");
    }

    if (updated.includes("InteropLegacyArchitecture")) {
      const message =
        "DotLottie Android patch failed: InteropLegacyArchitecture is still present. " +
        `Please update the postinstall patch for ${filePath}.`;
      echo(chalk.red(message));
      throw new Error(message);
    }
  }

  // Create the dev .env file with APP_NAME if it doesn't exist
  const exists = existsSync(".env");
  if (!exists) {
    const str = `APP_NAME="LL [DEV]"
ANALYTICS_TOKEN=ICid4O5K4AE2Utbv1ZT5CLmZalVWz8V9
BRAZE_ANDROID_API_KEY="be5e1bc8-43f1-4864-b097-076a3c693a43"
BRAZE_IOS_API_KEY="e0a7dfaf-fc30-48f6-b998-01dbebbb73a4"
BRAZE_CUSTOM_ENDPOINT="sdk.fra-02.braze.eu"`;
    await fs.promises.writeFile(".env", str, "utf8");
  }

  if (process.env["DEBUG_RNDEBUGGER"] == "1") {
    await $`rndebugger-open`;
  }

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
