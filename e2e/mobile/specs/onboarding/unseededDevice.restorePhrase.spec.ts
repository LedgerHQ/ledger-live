import { runUnseededRestorePhraseTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6975"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededRestorePhraseTest(testConfig.tmsLinks, testConfig.tags);
