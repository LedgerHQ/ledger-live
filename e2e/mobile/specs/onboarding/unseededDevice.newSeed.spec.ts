import { runUnseededNewSeedTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6970"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededNewSeedTest(testConfig.tmsLinks, testConfig.tags);
