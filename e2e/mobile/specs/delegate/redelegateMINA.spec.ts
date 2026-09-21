import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Addresses } from "@ledgerhq/live-e2e-shared/enum/Addresses";
import { runMinaRedelegateTest } from "@e2e/specs/delegate/delegate";

// `Mina 2` is the account kept delegated, to Kraken: redelegating targets another validator, which
// is the address the device review renders.
const delegation = new Delegate(
  Account.MINA_2,
  "N/A",
  "Auro Wallet",
  Addresses.MINA_AURO_VALIDATOR,
);
runMinaRedelegateTest(
  delegation,
  ["B2CQA-387"],
  ["@NanoSP", "@NanoX", "@Stax", "@Flex", "@NanoGen5", "@mina", "@family-mina"],
);
