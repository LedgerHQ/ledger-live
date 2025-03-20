import { findFreePort, close as closeBridge, init as initBridge } from "./bridge/server";
import { getEnv, setEnv } from "@ledgerhq/live-env";
import { device } from "detox";

export function setupEnvironment() {
  setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);

  if (process.env.MOCK == "0") {
    setEnv("MOCK", "");
    process.env.MOCK = "";
    console.warn("MOCK is disabled");
  } else {
    setEnv("MOCK", "1");
    process.env.MOCK = "1";
    console.warn("MOCK ENABLED");
  }

  if (process.env.DISABLE_TRANSACTION_BROADCAST == "0") {
    setEnv("DISABLE_TRANSACTION_BROADCAST", false);
  } else if (getEnv("MOCK") != "1") {
    setEnv("DISABLE_TRANSACTION_BROADCAST", true);
  }
}

export async function launchApp() {
  const port = await findFreePort();
  closeBridge();
  initBridge(port);
  await device.launchApp({
    launchArgs: {
      wsPort: port,
      detoxURLBlacklistRegex:
        '\\(".*sdk.*.braze.*",".*.googleapis.com/.*",".*clients3.google.com.*",".*tron.coin.ledger.com/wallet/getBrokerage.*"\\)',
      mock: getEnv("MOCK") ? getEnv("MOCK") : "0",
      disable_broadcast: getEnv("DISABLE_TRANSACTION_BROADCAST") ? 1 : 0,
    },
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
    permissions: {
      camera: "YES", // Give iOS permissions for the camera
    },
  });
  return port;
}
