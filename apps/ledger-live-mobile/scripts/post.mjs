#!/usr/bin/env zx
import "zx/globals";
import rimraf from "rimraf";

cd(path.join(__dirname, ".."));

const syncFamilies = async () =>
  await $`zx ./scripts/sync-families-dispatch.mjs`;

const patchers = async () => {
  await $`patch -N -i scripts/patches/RNFastCrypto.h.patch node_modules/react-native-fast-crypto/ios/RNFastCrypto.h 2>/dev/null`;

  // patching transitive gradle dependency
  await $`patch -N -i ./scripts/patches/react-native-video.2575.patch node_modules/react-native-video/android-exoplayer/src/main/java/com/brentvatne/exoplayer/ReactExoplayerView.java 2>/dev/null`;
  await $`patch -N -i ./scripts/patches/react-native-video+5.2.0.patch node_modules/react-native-video/android-exoplayer/build.gradle 2>/dev/null`;

  // See: https://github.com/expo/expo/issues/15622#issuecomment-997225774
  // patch -N -i scripts/patches/RNAnalytics.h.patch node_modules/@segment/analytics-react-native/ios/RNAnalytics/RNAnalytics.h
};

const final = async () => {
  rimraf("third-party/glog-0.3.5/test-driver", e => {
    if (!!e) echo(chalk.red(e));
  });

  // Had to remove the following because we already have the AsyncSocket lib as a dependency from Flipper 🐬
  // Why would anyone bundle an external lib available on CocoaPods anyway?
  // It's been fixed in https://github.com/tradle/react-native-udp/pull/112 but as of today it's not part of any release
  // IT SEEMS WE DON'T NEED THIS ANYMORE 👆 AS THE VERSION CONTAINING THE FIX WAS 2.60 AND WE ARE USING  ^4.0.0
  // await fs.promises.rm("node_modules/react-native-tcp/ios/CocoaAsyncSocket", { force: true, recursive: true });

  // issue: https://github.com/WalletConnect/walletconnect-monorepo/issues/595
  // manually shim
  // sed -i -- 's/require("crypto")/require("react-native-crypto")/g' node_modules/@walletconnect/randombytes/dist/cjs/node/index.js

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
    // (
    //  cd node_modules/react-native/scripts
    //  echo "- switch to relative paths in react_native_pods.rb "
    //  sed -i '' -e "s/File[.]join[(]__dir__, \"[.][.]\"[)]/\"..\/..\/node_modules\/react-native\"/" react_native_pods.rb
    //  sed -i '' -e "s/#{File[.]join[(]__dir__, \"generate-specs.sh\"[)]}/..\/..\/node_modules\/react-native\/scripts\/generate-specs.sh/" react_native_pods.rb
    //  sed -i '' -e "s/spec[.]prepare_command = \"#/spec.prepare_command = \"cd ..\/.. \&\& #/" react_native_pods.rb
    //  )

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
await patchers();
await final();
