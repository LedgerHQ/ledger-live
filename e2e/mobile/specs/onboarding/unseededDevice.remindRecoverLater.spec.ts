import { runUnseededRemindRecoverLaterTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6973"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUnseededRemindRecoverLaterTest(testConfig.tmsLinks, testConfig.tags);
