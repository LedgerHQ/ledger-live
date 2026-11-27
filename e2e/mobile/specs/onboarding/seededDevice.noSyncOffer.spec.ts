import { runNoSyncOfferTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6952"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runNoSyncOfferTest(testConfig.tmsLinks, testConfig.tags);
