import { runCreateRenameDeleteContactTest } from "./contacts";

const testConfig = {
  tmsLinks: ["B2CQA-6238"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runCreateRenameDeleteContactTest(testConfig.tmsLinks, testConfig.tags);
