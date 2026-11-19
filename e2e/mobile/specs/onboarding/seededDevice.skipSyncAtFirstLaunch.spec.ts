import { runSkipSyncAtFirstLaunchTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-XXXX"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSkipSyncAtFirstLaunchTest(testConfig.tmsLinks, testConfig.tags);
