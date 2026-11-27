import { runSkipSyncAtFirstLaunchTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6946"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSkipSyncAtFirstLaunchTest(testConfig.tmsLinks, testConfig.tags);
