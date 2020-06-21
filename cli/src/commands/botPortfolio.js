// @flow
import { from, defer } from "rxjs";
import { filter, map, mergeAll } from "rxjs/operators";
import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getCurrencyBridge } from "@ledgerhq/live-common/lib/bridge";
import { formatAccount } from "@ledgerhq/live-common/lib/account/formatters";

const blacklist = ["decred", "tezos", "stellar", "ethereum_classic"];

export default {
  description:
    "Use speculos and a list of supported coins to retrieve all accounts",
  args: [],
  job: () => {
    return from(listSupportedCurrencies()).pipe(
      filter((c) => !blacklist.includes(c.id) && !c.isTestnetFor),
      map((currency) =>
        defer(() =>
          getCurrencyBridge(currency).scanAccounts({
            currency,
            deviceId: `speculos:nanos:${currency.id}`,
            syncConfig: { paginationConfig: {} },
          })
        )
      ),
      mergeAll(5),
      filter((e) => e.type === "discovered"),
      map((e) => formatAccount(e.account))
    );
  },
};
