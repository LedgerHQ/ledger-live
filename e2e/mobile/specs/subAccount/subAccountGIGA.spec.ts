import { runSendSPL } from "./subAccount";

const transactionE2E = [
  {
    tx: new Transaction(Account.SOL_GIGA_1, Account.SOL_GIGA_2, "0.5", undefined, "noTag"),
    xrayTicket: ["B2CQA-3055", "B2CQA-3057"],
  },
];

for (const transaction of transactionE2E) {
  runSendSPL(transaction.tx, transaction.xrayTicket);
}
