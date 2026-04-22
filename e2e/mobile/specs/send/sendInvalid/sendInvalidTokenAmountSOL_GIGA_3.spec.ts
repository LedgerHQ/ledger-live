import { TokenAccount } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendInvalidTokenAmountTest } from "../send";

const transaction = new Transaction(
  TokenAccount.SOL_GIGA_3,
  TokenAccount.SOL_GIGA_1,
  "0.5",
  undefined,
  "noTag",
);
runSendInvalidTokenAmountTest(
  transaction,
  new RegExp(
    String.raw`You need \d+\.\d+ SOL in your account to pay for transaction fees on the Solana` +
      String.raw` network\.\s+Buy SOL or deposit more into your account\.`,
  ),
  ["B2CQA-3058"],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@solana", "@family-solana"],
);
