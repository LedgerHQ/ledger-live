import { runPayNewPaymentTest } from "@e2e/specs/paytab/paytab";

const testConfig = {
  tmsLinks: ["B2CQA-6327"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPayNewPaymentTest(testConfig.tmsLinks, testConfig.tags);
