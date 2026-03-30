// TODO: Reactivate when DOT is reactivated on swap prod
const swap = new Swap(Account.ETH_1, Account.DOT_1, "0.02", Fee.MEDIUM);
runSwapTest(
  swap,
  ["B2CQA-3017"],
  [
    "@NanoSP",
    "@LNS",
    "@NanoX",
    "@Stax",
    "@Flex",
    "@NanoGen5",
    "@ethereum",
    "@family-evm",
    "@polkadot",
    "@family-polkadot",
  ],
);
