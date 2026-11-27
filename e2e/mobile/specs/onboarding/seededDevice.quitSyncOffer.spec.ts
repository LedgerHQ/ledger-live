import { runQuitSyncOfferTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6954"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runQuitSyncOfferTest(testConfig.tmsLinks, testConfig.tags);
