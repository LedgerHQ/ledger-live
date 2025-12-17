import { runUserCanExportLogsTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-2074"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runUserCanExportLogsTest(testConfig.tmsLinks, testConfig.tags);
