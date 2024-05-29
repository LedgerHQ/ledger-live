import { device } from "detox";
import * as serverBridge from "./bridge/server";
import fs from "fs";
import net from "net";
import { getLogs } from "./bridge/server";
import { getState } from "expect";
import { getFlags } from "./bridge/server";
import { Feature, FeatureId } from "@ledgerhq/types-live";
import { getEnvs } from "./bridge/server";
import { EnvName } from "@ledgerhq/live-env";

let port: number;
const environmentFilePath = "artifacts/environment.properties";

const formatFlagsData = (data: { [key in FeatureId]: Feature }) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    allureData += `FF.${key} = ${value.enabled}\n`;

    const entries = {
      desktop_version: value.desktop_version,
      mobile_version: value.mobile_version,
      enabledOverriddenForCurrentVersion: value.enabledOverriddenForCurrentVersion,
      languages_whitelisted: value.languages_whitelisted?.join(", "),
      languages_blacklisted: value.languages_blacklisted?.join(", "),
      enabledOverriddenForCurrentLanguage: value.enabledOverriddenForCurrentLanguage,
      overridesRemote: value.overridesRemote,
      overriddenByEnv: value.overriddenByEnv,
      params: value.params ? JSON.stringify(value.params) : undefined,
    };

    for (const [field, fieldValue] of Object.entries(entries)) {
      if (fieldValue !== undefined) {
        allureData += `FF.${key}.${field} = ${fieldValue
          .toString()
          .replace(/^\{|\}$/g, "")
          .replace(/"/g, " ")}\n`;
      }
    }
  }
  return allureData;
};

const formatEnvData = (data: { [key in EnvName]: string }) => {
  let allureData = "";
  for (const [key, value] of Object.entries(data)) {
    allureData += `ENV.${key} = ${value}\n`;
  }
  return allureData;
};

beforeAll(
  async () => {
    port = await findFreePort();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
    await launchApp();
  },
  process.env.CI ? 150000 : 300000,
);

export async function launchApp() {
  serverBridge.close();
  serverBridge.init(port);
  await device.launchApp({
    launchArgs: {
      wsPort: port,
      detoxURLBlacklistRegex:
        '\\(".*sdk.*.braze.*",".*.googleapis.com/.*",".*app.adjust.*",".*clients3.google.com.*"\\)',
    },
    languageAndLocale: {
      language: "en-US",
      locale: "en-US",
    },
    permissions: {
      camera: "YES", // Give iOS permissions for the camera
    },
  });
}

afterEach(async () => {
  if (process.env.CI) {
    const testFile = (getState().testPath?.split("/").pop() || "logs").split(".")[0];
    const testName = (getState().currentTestName || "").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    await getLogs(`${testFile}_${testName}`);
  }
});

afterAll(async () => {
  const featureFlags = await getFlags();
  const appEnvs = await getEnvs();

  const flagsData = formatFlagsData(JSON.parse(featureFlags));
  const envsData = formatEnvData(JSON.parse(appEnvs));
  fs.appendFile(environmentFilePath, flagsData + envsData, (err: NodeJS.ErrnoException | null) => {
    if (err) throw err;
  });

  serverBridge.close();
});

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer({ allowHalfOpen: false });

    server.on("listening", () => {
      const address = server.address();
      if (address && typeof address !== "string") {
        const port: number = address.port;
        server.close(() => {
          resolve(port); // Resolve with the free port
        });
      } else {
        console.warn("Unable to determine port. Selecting default");
        resolve(8099); // Resolve with the free port
      }
    });

    server.on("error", err => {
      reject(err); // Reject with the error
    });

    server.listen(0); // Let the system choose an available port
  });
}
