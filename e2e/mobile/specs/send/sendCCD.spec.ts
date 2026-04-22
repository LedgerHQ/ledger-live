import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runSendTest } from "./send";

const transaction = new Transaction(Account.CCD_TESTNET_1, Account.CCD_TESTNET_2, "50", undefined);
runSendTest(transaction, [], ["@NanoSP", "@concordium", "@family-concordium"], {
  featureFlags: { currencyConcordiumTestnet: { enabled: true } },
  userdata: "concordium-account",
  liveDataOptions: { currency: Account.CCD_TESTNET_1.currency.id },
});
