import { TokenAccount } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendInvalidTokenAmountTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: TokenAccount.SOL_GIGA_4,
  accountToCredit: TokenAccount.SOL_GIGA_1,
  amount: "0.5",
  memoTag: "noTag",
});
runSendInvalidTokenAmountTest({
  transaction,
  expectedErrorMessage: new RegExp(
    String.raw`You need \d+\.\d+ SOL in your account to pay for transaction fees on the Solana` +
      String.raw` network\.\s+Buy SOL or deposit more into your account\.`,
  ),
  tmsLinks: ["B2CQA-3058"],
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
});
