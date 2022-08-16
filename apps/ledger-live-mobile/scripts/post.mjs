#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

cd(path.join(__dirname, ".."));

const syncFamilies = async () =>
  await $`zx ./scripts/sync-families-dispatch.mjs`;

const final = async () => {
  // Create the dev .env file with APP_NAME if it doesn't exist
  const exists = fs.existsSync(".env");
  if (!exists) {
    const str = `APP_NAME="LL [DEV]"`;
    await fs.promises.writeFile(".env", str, "utf8");
  }

  if (process.env["DEBUG_RNDEBUGGER"] == "1") {
    await $`rndebugger-open`;
  }

  try {
    await which("bundle");
  } catch (error) {
    echo(
      chalk.red(
        "Error: `bundle` command is missing. Please install Bundler. https://bundler.io",
      ),
    );
    await $`exit 1`;
  }
  await $`bundle install`;

  if (os.platform() === "darwin") {
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
