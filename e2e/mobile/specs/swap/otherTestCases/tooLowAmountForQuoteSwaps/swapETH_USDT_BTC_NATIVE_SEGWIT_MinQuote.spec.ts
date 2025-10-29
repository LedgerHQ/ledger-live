import { runTooLowAmountForQuoteSwapsTest } from "../swap.other";

const transactionE2E = {
  swap: new Swap(TokenAccount.ETH_USDT_1, Account.BTC_NATIVE_SEGWIT_1, "0.000001"),
  tmsLinks: ["B2CQA-3242"],
  errorMessage: new RegExp(/Minimum \d+(\.\d{1,10})? USDT needed for quotes\.[\s\S]*Learn More/),
  ctaBanner: false,
  quotesVisible: false,
  tags: ["@NanoSP", "@LNS", "@NanoX", "@Stax"],
};

runTooLowAmountForQuoteSwapsTest(
  transactionE2E.swap,
  transactionE2E.tmsLinks,
  transactionE2E.errorMessage,
  transactionE2E.ctaBanner,
  transactionE2E.quotesVisible,
  transactionE2E.tags,
);
