import { runRevampedPasswordIncorrectTest } from "@e2e/specs/settings/settings";

const testConfig = {
  tmsLinks: ["B2CQA-2343"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runRevampedPasswordIncorrectTest(testConfig.tmsLinks, testConfig.tags);
