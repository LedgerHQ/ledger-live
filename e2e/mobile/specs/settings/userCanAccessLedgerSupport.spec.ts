import { runUserCanAccessLedgerSupportTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-820"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUserCanAccessLedgerSupportTest(testConfig.tmsLinks, testConfig.tags);
