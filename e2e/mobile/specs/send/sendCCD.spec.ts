import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(
  Account.CCD_TESTNET_1,
  Account.CCD_TESTNET_2,
  "0.000005",
  undefined,
);
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
