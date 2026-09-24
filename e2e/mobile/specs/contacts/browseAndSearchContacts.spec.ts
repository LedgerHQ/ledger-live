import { runBrowseAndSearchContactsTest } from "@e2e/specs/contacts/contacts";

const testConfig = {
  tmsLinks: ["B2CQA-6240"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runBrowseAndSearchContactsTest(testConfig.tmsLinks, testConfig.tags);
