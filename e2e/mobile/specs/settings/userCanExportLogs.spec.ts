import { runUserCanExportLogsTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-2074"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runUserCanExportLogsTest(testConfig.tmsLinks, testConfig.tags);
