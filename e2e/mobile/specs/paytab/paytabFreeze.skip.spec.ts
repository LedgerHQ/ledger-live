import { runPayFreezeTest } from "@e2e/specs/paytab/paytab";

const testConfig = {
  tmsLinks: ["B2CQA-6329"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPayFreezeTest(testConfig.tmsLinks, testConfig.tags);
