import { runPayBalanceAndDepositTest } from "@e2e/specs/paytab/paytab";

const testConfig = {
  tmsLinks: ["B2CQA-6325"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPayBalanceAndDepositTest(testConfig.tmsLinks, testConfig.tags);
