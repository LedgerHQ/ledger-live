import { runSendSPL } from "./subAccount";

const transactionE2E = [
  {
    tx: new Transaction(
      TokenAccount.SOL_GIGA_1,
      TokenAccount.SOL_GIGA_2,
      "0.5",
      undefined,
      "noTag",
    ),
    xrayTicket: ["B2CQA-3055", "B2CQA-3057"],
    tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex"],
  },
];

for (const transaction of transactionE2E) {
  runSendSPL(transaction.tx, transaction.xrayTicket, transaction.tag);
}
