import { runUnseededQuitSyncOfferTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6972"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededQuitSyncOfferTest(testConfig.tmsLinks, testConfig.tags);
