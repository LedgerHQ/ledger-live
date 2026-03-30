import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { allure } from "jest-allure2-reporter/api";
import { runSendTest } from "./send";

allure.issue("LIVE-28070");

const transaction = new Transaction(Account.BASE_1, Account.BASE_2, "0.000001");
runSendTest(
  transaction,
  ["B2CQA-4225"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@base", "@family-evm"],
);
