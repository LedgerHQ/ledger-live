import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { allure } from "jest-allure2-reporter/api";
import { runSendTest } from "@e2e/specs/send/send";

allure.issue("LIVE-28070");

const transaction = new Transaction({
  accountToDebit: Account.BASE_1,
  accountToCredit: Account.BASE_2,
  amount: "0.000001",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-4225"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@base", "@family-evm"],
});
