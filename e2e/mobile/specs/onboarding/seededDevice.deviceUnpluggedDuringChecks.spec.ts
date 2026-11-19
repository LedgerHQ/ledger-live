import { runDeviceUnpluggedDuringChecksTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-XXXX"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runDeviceUnpluggedDuringChecksTest(testConfig.tmsLinks, testConfig.tags);
