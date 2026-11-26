import { runSkipSyncFromOnboardedInstanceTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6951"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runSkipSyncFromOnboardedInstanceTest(testConfig.tmsLinks, testConfig.tags);
