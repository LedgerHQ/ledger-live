import { runPasswordUnlockTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-1763"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@smoke"],
};

runPasswordUnlockTest(testConfig.tmsLinks, testConfig.tags);
