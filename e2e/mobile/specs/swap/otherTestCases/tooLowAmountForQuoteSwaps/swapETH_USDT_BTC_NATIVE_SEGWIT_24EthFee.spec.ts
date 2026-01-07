import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runTooLowAmountForQuoteSwapsTest } from "../swap.other";

const transactionE2E = {
  swap: new Swap(TokenAccount.ETH_USDT_2, Account.BTC_NATIVE_SEGWIT_1, "USE_MIN_AMOUNT"),
  tmsLinks: ["B2CQA-3241"],
  errorMessage: new RegExp(/\d+(\.\d{1,10})? ETH needed for network fees\.[\s\S]*Learn More/),
  ctaBanner: true,
  quotesVisible: true,
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
