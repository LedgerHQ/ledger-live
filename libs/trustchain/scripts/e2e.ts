/* eslint-disable no-console */
import fsPromises from "fs/promises";
import { listen } from "@ledgerhq/logs";
import { recordTestTrustchainSdk } from "../src/test-helpers/recordTrustchainSdkTests";
import path from "path";
import expect from "expect";

// we force inject expect to allow us to have expect() code in the test-scenarios
(global as any).expect = expect;

async function main() {
  const scenarioFolder = path.join(__dirname, "../src/test-scenarios");
  const unitFolder = path.join(__dirname, "../src/__tests__/sdk");
  const files = await fsPromises.readdir(scenarioFolder);

  for (const file of files) {
    if (file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.startsWith("_")) {
      const slug = file.slice(0, -3);
      const e2eFile = path.join(scenarioFolder, file);
      const mod = await import(e2eFile);
      const scenario = mod.scenario;
      const snapshotFile = path.join(unitFolder, slug + ".json");
      const unitTestFile = path.join(unitFolder, slug + ".ts");
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
      // we also rebootrap missing test files
      if (!(await exists(unitTestFile))) {
        await fsPromises.writeFile(
          unitTestFile,
          `import json from "./${slug}.json";
import { replayTrustchainSdkTests } from "../../test-helpers/replayTrustchainSdkTests";
import { scenario } from "../../test-scenarios/${slug}";
replayTrustchainSdkTests(json, scenario);
`,
        );
      }
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
