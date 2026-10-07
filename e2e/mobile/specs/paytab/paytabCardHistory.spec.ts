import { runPayCardHistoryTest } from "@e2e/specs/paytab/paytab";

const testConfig = {
  tmsLinks: ["B2CQA-6331"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPayCardHistoryTest(testConfig.tmsLinks, testConfig.tags);
