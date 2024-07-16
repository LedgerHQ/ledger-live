/* eslint-disable no-console */
import fsPromises from "fs/promises";
import { listen } from "@ledgerhq/logs";
import { recordTestTrustchainSdk } from "../tests/test-helpers/recordTrustchainSdkTests";
import path from "path";
import expect from "expect";

// we force inject expect to allow us to have expect() code in the test-scenarios
(global as any).expect = expect;

async function main() {
  const scenarioFolder = path.join(__dirname, "../tests/scenarios");
  const mockFolder = path.join(__dirname, "../mocks/scenarios");
  const files = await fsPromises.readdir(scenarioFolder);

  for (const file of files) {
    if (file.endsWith(".ts") && !file.startsWith("_")) {
      const slug = file.slice(0, -3);
      const e2eFile = path.join(scenarioFolder, file);
      const mod = await import(e2eFile);
      const scenario = mod.scenario;
      const snapshotFile = path.join(mockFolder, slug + ".json");
      const snapshotFileExists = await exists(snapshotFile);
      if (snapshotFileExists && !process.env.RUN_EVEN_IF_SNAPSHOT_EXISTS) {
        continue;
      }
      console.log("RUNNING E2E ON TEST SCENARIO", slug);
      // otherwise we always run the e2e but don't touch existing snapshots
      await recordTestTrustchainSdk(snapshotFileExists ? null : snapshotFile, scenario, {
        coinapps: __dirname,
        overridesAppPath: "app.elf",
        ...mod.recorderConfig,
      });
    }
  }
}

main();

function exists(file: string): Promise<boolean> {
  return fsPromises.access(file).then(
    () => true,
    () => false,
  );
}

if (process.env.VERBOSE) {
  listen(log => {
    console.log(log.type + ": " + log.message);
  });
}
