import { runTooLowAmountForQuoteSwapsTest } from "../swap.other";

const transactionE2E = {
  swap: new Swap(Account.ETH_1, Account.BTC_NATIVE_SEGWIT_1, "10000"),
  tmsLinks: ["B2CQA-3243"],
  errorMessage: new RegExp(/Not enough balance, including network fee\./),
  ctaBanner: true,
  quotesVisible: false,
};

runTooLowAmountForQuoteSwapsTest(
  transactionE2E.swap,
  transactionE2E.tmsLinks,
  transactionE2E.errorMessage,
  transactionE2E.ctaBanner,
  transactionE2E.quotesVisible,
  ["@NanoSP", "@LNS", "@NanoX"],
);
