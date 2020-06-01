/* eslint-disable no-console */
// @flow
import { from } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import { getCurrencyBridge } from "@ledgerhq/live-common/lib/bridge";
import { formatAccount } from "@ledgerhq/live-common/lib/account/formatters";

const blacklist = [
  "decred",
  "tezos",
  "bitcoin_cash",
  "bitcoin_gold",
  "ethereum_classic",
  "hcash",
  "poswallet",
];

export default {
  description:
    "Use speculos and a list of supported coins to retrieve all accounts",
  args: [],
  job: () => {
    return from(listSupportedCurrencies()).pipe(
      filter((c) => !blacklist.includes(c.id)),
      filter((c) => !c.isTestnetFor),
      mergeMap((currency) =>
        getCurrencyBridge(currency).scanAccounts({
          currency,
          deviceId: `speculos:nanos:${currency.id}`,
          syncConfig: { paginationConfig: {} },
        })
      ),
      filter((e) => e.type === "discovered"),
      map((e) => formatAccount(e.account, "summary"))
    );
  },
};
