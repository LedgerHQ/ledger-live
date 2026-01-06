import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runTooLowAmountForQuoteSwapsTest } from "../swap.other";

const transactionE2E = {
  swap: new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "200"),
  tmsLinks: ["B2CQA-3240"],
  errorMessage: "Not enough balance",
  ctaBanner: false,
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
