import { runUserCanExportLogsTest } from "@e2e/specs/settings/settings";

const testConfig = {
  tmsLinks: ["B2CQA-2074"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@smoke"],
};

runUserCanExportLogsTest(testConfig.tmsLinks, testConfig.tags);
