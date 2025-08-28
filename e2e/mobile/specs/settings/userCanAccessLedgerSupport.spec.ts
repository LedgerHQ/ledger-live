import { runUserCanAccessLedgerSupportTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-820"],
  tags: ["@NanoSP", "@LNS", "@NanoX"],
};

runUserCanAccessLedgerSupportTest(testConfig.tmsLinks, testConfig.tags);
