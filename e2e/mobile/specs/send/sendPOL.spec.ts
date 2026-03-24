import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { allure } from "jest-allure2-reporter/api";
import { runSendTest } from "./send";

allure.issue("LIVE-28070");

const transaction = new Transaction(Account.POL_1, Account.POL_2, "0.001", Fee.SLOW);
runSendTest(
  transaction,
  ["B2CQA-2807"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@polygon", "@family-evm"],
);
