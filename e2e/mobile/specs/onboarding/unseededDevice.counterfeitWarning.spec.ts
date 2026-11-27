import { runUnseededCounterfeitWarningTest } from "@e2e/specs/onboarding/deviceOnboarding";

const testConfig = {
  tmsLinks: ["B2CQA-6981"],
  tags: ["@NanoSP", "@NanoX"],
};

runUnseededCounterfeitWarningTest(testConfig.tmsLinks, testConfig.tags);
