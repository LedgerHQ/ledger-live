import { runRevampedPasswordUnlockTest } from "@e2e/specs/settings/settings";

const testConfig = {
  tmsLinks: ["B2CQA-1763"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@smoke"],
};

runRevampedPasswordUnlockTest(testConfig.tmsLinks, testConfig.tags);
