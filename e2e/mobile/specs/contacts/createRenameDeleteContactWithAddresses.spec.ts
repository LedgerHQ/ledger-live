import { runCreateRenameDeleteContactWithAddressesTest } from "@e2e/specs/contacts/contacts";

const testConfig = {
  tmsLinks: ["B2CQA-6239"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runCreateRenameDeleteContactWithAddressesTest(testConfig.tmsLinks, testConfig.tags);
