import { device } from "detox";
import * as serverBridge from "./bridge/server";
import fs from "fs";
import { getState } from "expect";
import { MatcherState } from "expect/build/types";
import { format } from "date-fns";
import { launchApp, deleteSpeculos } from "./helpers";
import { closeProxy } from "./bridge/proxy";
import { getEnv, setEnv } from "@ledgerhq/live-env";

const currentDate = new Date();
const date = format(currentDate, "MM-dd");
const directoryPath = `artifacts/${date}_LLM`;
const broadcastOriginalValue = getEnv("DISABLE_TRANSACTION_BROADCAST");

if (process.env.MOCK == "0") {
  setEnv("MOCK", "");
  process.env.MOCK = "";
} else {
  setEnv("MOCK", "1");
  process.env.MOCK = "1";
}

if (process.env.DISABLE_TRANSACTION_BROADCAST == "0") {
  setEnv("DISABLE_TRANSACTION_BROADCAST", false);
} else if (getEnv("MOCK") != "1") {
  setEnv("DISABLE_TRANSACTION_BROADCAST", true);
}

beforeAll(
  async () => {
    setEnv("DISABLE_APP_VERSION_REQUIREMENTS", true);

    const port = await launchApp();
    await device.reverseTcpPort(8081);
    await device.reverseTcpPort(port);
    await device.reverseTcpPort(52619); // To allow the android emulator to access the dummy app
  },
  process.env.CI ? 150000 : 300000,
);

afterEach(async () => {
  if (process.env.CI) writeFile(getState(), "json", await serverBridge.getLogs());
});

afterAll(async () => {
  setEnv("DISABLE_TRANSACTION_BROADCAST", broadcastOriginalValue);
  serverBridge.close();
  closeProxy();
  await deleteSpeculos();
});

const writeFile = (state: MatcherState, extension: string, data: string) => {
  const time = format(currentDate, "HH-mm-ss");

  const testFile = (state.testPath?.split("/").pop() || "logs").split(".")[0];
  const testName = (state.currentTestName || "").replace(/[^a-z0-9]/gi, "_").toLowerCase();

  const fileName = `${date}_${time}-${testFile}_${testName}.${extension}`;
  const filePath = `${directoryPath}/${fileName}`;

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
  fs.writeFileSync(filePath, data, "utf-8");
  return filePath;
};
