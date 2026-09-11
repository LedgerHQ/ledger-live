import { runContactsKeyboardTest } from "@e2e/specs/contacts/contacts";

const testConfig = {
  tmsLinks: ["B2CQA-6238"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runContactsKeyboardTest(testConfig.tmsLinks, testConfig.tags);
