import { runAcceptOsUpdateTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6956"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runAcceptOsUpdateTest(testConfig.tmsLinks, testConfig.tags);
