import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runTooLowAmountForQuoteSwapsTest } from "../swap.other";

const transactionE2E = {
  swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "10000"),
  tmsLinks: ["B2CQA-3243"],
  errorMessage: "Not enough balance, including network fee",
  ctaBanner: true,
  quotesVisible: false,
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
};

runTooLowAmountForQuoteSwapsTest(
  transactionE2E.swap,
  transactionE2E.tmsLinks,
  transactionE2E.errorMessage,
  transactionE2E.ctaBanner,
  transactionE2E.quotesVisible,
  transactionE2E.tags,
);
