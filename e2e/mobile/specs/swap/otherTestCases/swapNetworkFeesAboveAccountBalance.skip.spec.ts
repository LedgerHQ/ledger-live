import { runSwapNetworkFeesAboveAccountBalanceTest } from "@e2e/specs/swap/otherTestCases/swap.other";

// Enable test when "Sponsored" program is over
const testConfig = {
  swap: new Swap({
    accountToDebit: TokenAccount.ETH_USDT_2,
    accountToCredit: Account.BTC_NATIVE_SEGWIT_1,
    amount: "USE_MIN_AMOUNT",
  }),
  errorMessage: new RegExp(/\d+(\.\d{1,10})? ETH needed for network fees\./),
  tmsLinks: ["B2CQA-2363"],
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

runSwapNetworkFeesAboveAccountBalanceTest(testConfig);
