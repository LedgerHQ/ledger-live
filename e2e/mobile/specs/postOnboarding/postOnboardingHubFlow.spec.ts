import { runPostOnboardingHubFlowTest } from "@e2e/specs/postOnboarding/postOnboardingHub";

const testConfig = {
  tmsLinks: ["B2CQA-6545"],
  tags: ["@postOnboarding", "@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPostOnboardingHubFlowTest(testConfig.tmsLinks, testConfig.tags);
