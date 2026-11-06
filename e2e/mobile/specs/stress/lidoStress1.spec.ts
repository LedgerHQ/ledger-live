import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { EarnProvider } from "@ledgerhq/live-e2e-shared/enum/Provider";
import { runPartnerDappCTATest } from "@e2e/specs/earn/earnV2";

for (let iteration = 0; iteration < 8; iteration++) {
  runPartnerDappCTATest(
    Account.ETH_1,
    EarnProvider.LIDO.name,
    "stake.lido.fi",
    [],
    ["@NanoX", "@ethereum", "@family-evm"],
  );
}
