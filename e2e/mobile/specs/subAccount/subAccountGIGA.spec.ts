import { runSendSPL } from "@e2e/specs/subAccount/subAccount";

const transactionE2E = [
  {
    tx: new Transaction({
      accountToDebit: TokenAccount.SOL_GIGA_1,
      accountToCredit: TokenAccount.SOL_GIGA_2,
      amount: "0.5",
      memoTag: "noTag",
    }),
    xrayTicket: ["B2CQA-3055"],
    tag: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
  },
];

for (const transaction of transactionE2E) {
  runSendSPL({
    transaction: transaction.tx,
    tmsLinks: transaction.xrayTicket,
    tags: transaction.tag,
  });
}
