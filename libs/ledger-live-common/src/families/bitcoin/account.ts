import type { Account } from "@ledgerhq/types-live";
import type { AccountModule } from "../../coin-modules/types";

// Bitcoin Cash receive addresses are shown and verified in their cashaddr form.
function injectGetAddressParams(account: Account): Record<string, unknown> {
  return account.currency.id === "bitcoin_cash" ? { forceFormat: "cashaddr" } : {};
}

const accountModule: AccountModule = {
  injectGetAddressParams,
};

export default accountModule;
