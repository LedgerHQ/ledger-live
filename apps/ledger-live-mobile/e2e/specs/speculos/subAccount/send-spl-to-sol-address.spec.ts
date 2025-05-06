import { runSendSPL } from "./subAccount";
const transaction = new Transaction(
  Account.SOL_GIGA_1,
  Account.SOL_GIGA_2,
  "0.5",
  undefined,
  "noTag",
);
runSendSPL(transaction, ["B2CQA-3055"]);
