import { signAsync } from "@electron/osx-sign";
import chalk from "chalk";
import dotenv from "dotenv";

dotenv.config();

const info = str => {
  console.log(chalk.blue(str));
};

// electron-builder's own mac codesigning (macPackager.js -> doSign ->
// codeSign/macCodeSign.js) is a thin retry wrapper around this exact
// function (`@electron/osx-sign`'s signAsync) — calling it directly here
// produces the same signature the coupled `build`/`release`/`pre-build`
// commands already produce, for the one target (`--prepackaged`, non-MAS)
// where electron-builder itself doesn't invoke it.
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5_000;

async function attemptSign(options, retries) {
  try {
    await signAsync(options);
  } catch (e) {
    if (retries > 0) {
      console.warn(`RETRYING SIGN: ATTEMPTS LEFT ${retries}`);
      console.error(e?.message);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
      await attemptSign(options, retries - 1);
    } else {
      throw e;
    }
  }
}

async function signMacApp(appPath, { entitlements }) {
  if (process.env.SKIP_SIGNING === "true") {
    info("macOS signing skipped (SKIP_SIGNING=true)");
    return;
  }

  await attemptSign(
    {
      app: appPath,
      platform: "darwin",
      hardenedRuntime: true,
      optionsForFile: () => ({ entitlements }),
      // Mirrors electron-builder's own default ignore list.
      ignore: [
        /\.kext$/,
        /\/Contents\/PlugIns/,
        /\/node_modules\/puppeteer\/\.local-chromium/,
        /\/node_modules\/playwright-firefox\/\.local-browsers/,
        /\/node_modules\/playwright\/\.local-browsers/,
      ],
    },
    MAX_RETRIES,
  );
}

export default signMacApp;
