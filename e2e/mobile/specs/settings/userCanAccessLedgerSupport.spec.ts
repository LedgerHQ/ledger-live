import { runUserCanAccessLedgerSupportTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-820"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex"],
};

runUserCanAccessLedgerSupportTest(testConfig.tmsLinks, testConfig.tags);
