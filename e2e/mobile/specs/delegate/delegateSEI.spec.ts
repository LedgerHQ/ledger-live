import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { runEvmDelegateTest } from "./delegate";

const delegation = new Delegate(Account.SEI_1, "0.001", "Ledger by Figment");
runEvmDelegateTest(
  delegation,
  [],
  ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5", `@sei`, `@family-evm`],
  "accountSeiEvmStaking",
);
