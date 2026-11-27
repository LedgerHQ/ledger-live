import { runQuitBeforeChecksTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6953"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runQuitBeforeChecksTest(testConfig.tmsLinks, testConfig.tags);
