import { runCreateRenameDeleteContactTest } from "@e2e/specs/contacts/contacts";
import { allure } from "jest-allure2-reporter/api";

allure.issue("LIVE-37909");

const testConfig = {
  tmsLinks: ["B2CQA-6238"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runCreateRenameDeleteContactTest(testConfig.tmsLinks, testConfig.tags);
