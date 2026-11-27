import { runSwapTest } from "@e2e/specs/swap/swap";

runSwapTest({
  accountToDebit: Account.ETH_1,
  accountToCredit: Account.DOT_1,
  tmsLinks: ["B2CQA-3017"],
  tags: [
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
});
