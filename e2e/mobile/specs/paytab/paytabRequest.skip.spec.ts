import { runPayRequestTest } from "@e2e/specs/paytab/paytab";

const testConfig = {
  tmsLinks: ["B2CQA-6326"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPayRequestTest(testConfig.tmsLinks, testConfig.tags);
