import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runTooLowAmountForQuoteSwapsTest } from "../swap.other";

const transactionE2E = {
  swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "10000"),
  tmsLinks: ["B2CQA-3243"],
  errorMessage: "Insufficient balance",
  ctaBanner: false,
  quotesVisible: false,
  tags: [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@bitcoin",
    "@family-bitcoin",
  ],
};

runTooLowAmountForQuoteSwapsTest(
  transactionE2E.swap,
  transactionE2E.tmsLinks,
  transactionE2E.errorMessage,
  transactionE2E.ctaBanner,
  transactionE2E.quotesVisible,
  transactionE2E.tags,
  "buttonReplacement", // NOT_ENOUGH_BALANCE hides the banner in favor of the swap button replacement
);
