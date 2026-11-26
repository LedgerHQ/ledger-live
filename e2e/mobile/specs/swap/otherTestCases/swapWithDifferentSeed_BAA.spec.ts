import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSwapWithDifferentSeedTest } from "@e2e/specs/swap/otherTestCases/swap.other";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";

runSwapWithDifferentSeedTest({
  swap: new Swap({
    accountToDebit: Account.ETH_1,
    accountToCredit: Account.BTC_NATIVE_SEGWIT_1,
    amount: "0.03",
  }),
  tmsLinks: ["B2CQA-3091"],
  userData: "speculos-x-other-account",
  errorMessage:
    "This sending account does not belong to the connected device. Please change and retry.",
  addressFrom: Addresses.ETH_OTHER_SEED,
  addressTo: Addresses.BTC_NATIVE_SEGWIT_1,
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
});
