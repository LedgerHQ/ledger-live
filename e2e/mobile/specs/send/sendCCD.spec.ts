import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { runSendTest } from "@e2e/specs/send/send";

const transaction = new Transaction({
  accountToDebit: Account.CCD_TESTNET_1,
  accountToCredit: Account.CCD_TESTNET_2,
  amount: "0.000005",
});
runSendTest({
  transaction,
  tmsLinks: ["B2CQA-6118"],
  tags: ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@concordium", "@family-concordium"],
  featureFlags: { currencyConcordiumTestnet: { enabled: true } },
  userdata: "concordium-account",
  liveDataOptions: { currency: Account.CCD_TESTNET_1.currency.id },
  skipLNS: true,
});
