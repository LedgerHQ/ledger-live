import { runRenameContactOnDeviceTest } from "@e2e/specs/contacts/contacts";

// No @Stax: its rc builds stop at Ethereum 1.19.3. See CONTACTS_OS_VERSION_BY_MODEL.
const testConfig = {
  tmsLinks: [],
  tags: ["@NanoSP", "@NanoX", "@Flex", "@NanoGen5", "@ethereum", "@family-evm"],
};

runRenameContactOnDeviceTest(testConfig.tmsLinks, testConfig.tags);
