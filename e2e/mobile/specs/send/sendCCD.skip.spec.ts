// TODO: LIVE-30321 - Until app-concordium 5.6.0 is released, the test is skipped as it requires a specific app version
// with the Concordium testnet support.
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.CCD_TESTNET_1, Account.CCD_TESTNET_2, "50", undefined);
runSendTest(
  transaction,
  ["B2CQA-2949"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@concordium", "@family-concordium"],
  {
    featureFlags: { currencyConcordiumTestnet: { enabled: true } },
    userdata: "concordium-account",
    liveDataOptions: { currency: Account.CCD_TESTNET_1.currency.id },
  },
);
