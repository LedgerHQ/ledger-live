import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runHotStartTest } from "./earnV2";

const testConfig = {
  account: Account.ATOM_1,
  tmsLinks: ["B2CQA-XXXX"], // TODO: replace with actual Xray ticket ID
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@cosmos",
    "@family-cosmos",
  ],
};

runHotStartTest(testConfig.account, testConfig.tmsLinks, testConfig.tags);
