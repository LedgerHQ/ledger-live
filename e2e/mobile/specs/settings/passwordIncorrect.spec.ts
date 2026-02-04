import { runPasswordIncorrectTest } from "./settings";

const testConfig = {
  tmsLinks: ["B2CQA-2343"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runPasswordIncorrectTest(testConfig.tmsLinks, testConfig.tags);
