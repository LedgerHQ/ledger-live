/* eslint-disable @typescript-eslint/no-var-requires */
import path from "path";
import fs from "fs";
import { replayTrustchainSdkTests } from "../../../tests/test-helpers/replayTrustchainSdkTests";

const mockFolder = path.join(__dirname, "../../../mocks/scenarios");
const scenarioFolder = path.join(__dirname, "../../../tests/scenarios");

fs.readdirSync(mockFolder).forEach(file => {
  if (!file.endsWith(".json")) return;

  const slug = file.slice(0, -5);
  const json = require(path.join(mockFolder, file));
  const mod = require(path.join(scenarioFolder, slug + ".ts"));

  test(slug, async () => {
    const scenario = mod.scenario;
    await replayTrustchainSdkTests(json, scenario);
  });
});
