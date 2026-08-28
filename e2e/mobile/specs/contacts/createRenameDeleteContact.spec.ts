import { runCreateRenameDeleteContactTest } from "@e2e/specs/contacts/contacts";

const testConfig = {
  tmsLinks: ["B2CQA-6238"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runCreateRenameDeleteContactTest(testConfig.tmsLinks, testConfig.tags);
