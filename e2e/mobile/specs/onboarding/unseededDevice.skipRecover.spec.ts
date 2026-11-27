import { runUnseededSkipRecoverTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6974"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededSkipRecoverTest(testConfig.tmsLinks, testConfig.tags);
