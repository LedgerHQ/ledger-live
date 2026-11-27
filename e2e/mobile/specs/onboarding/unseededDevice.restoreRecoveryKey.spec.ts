import { runUnseededRestoreRecoveryKeyTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6977"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededRestoreRecoveryKeyTest(testConfig.tmsLinks, testConfig.tags);
