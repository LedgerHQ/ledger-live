import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.VET_1,
  accountToCredit: Account.VET_2,
  amount: "0.1",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-4247"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@vechain", "@family-vechain"],
});
