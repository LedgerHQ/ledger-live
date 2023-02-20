#!/usr/bin/env zx
import "zx/globals";

cd(path.join(__dirname, ".."));

const syncFamilies = async () =>
  await $`zx ./scripts/sync-families-dispatch.mjs`;

const final = async () => {
  // Had to remove the following because we already have the AsyncSocket lib as a dependency from Flipper 🐬
  // Why would anyone bundle an external lib available on CocoaPods anyway?
  // It's been fixed in https://github.com/tradle/react-native-udp/pull/112 but as of today it's not part of any release
  // See: https://github.com/Rapsssito/react-native-tcp-socket/issues/61#issuecomment-904842949
  await fs.promises.rm("node_modules/react-native-tcp/ios/CocoaAsyncSocket", {
    force: true,
    recursive: true,
  });

  // Create the dev .env file with APP_NAME if it doesn't exist
  const exists = fs.existsSync(".env");
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
      chalk.red(
        "Error: `bundle` command is missing. Please install Bundler. https://bundler.io",
      ),
    );
  }

  if (os.platform() === "darwin" && !process.env["SKIP_BUNDLE_CHECK"]) {
    cd("ios");
    try {
      await $`bundle exec pod install --deployment --repo-update`;
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
      await $`exit 1`;
    }
    cd("..");

    // We manually need to run Jetifier for React Native BLE PLX until they switch to AndroidX
    // https://github.com/Polidea/react-native-ble-plx#android-example-setup
    await $`pnpm jetify`;
  }
};

await syncFamilies();
await final();
