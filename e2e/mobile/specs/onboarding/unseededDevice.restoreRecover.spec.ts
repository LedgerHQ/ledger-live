import { runUnseededRestoreRecoverTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6976"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededRestoreRecoverTest(testConfig.tmsLinks, testConfig.tags);
