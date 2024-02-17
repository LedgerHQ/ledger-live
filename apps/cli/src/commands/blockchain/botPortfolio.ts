import { from, defer, throwError } from "rxjs";
import { catchError, filter, map, mergeAll, timeout } from "rxjs/operators";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { accountFormatters } from "@ledgerhq/live-common/account/index";
const blacklist = ["decred", "tezos", "stellar", "ethereum_classic"];
export default {
  description: "Use speculos and a list of supported coins to retrieve all accounts",
  args: [
    {
      name: "format",
      alias: "f",
      type: String,
      typeDesc: Object.keys(accountFormatters).join(" | "),
      desc: "how to display the data",
    },
  ],
  job: (opts: { format: string }) => {
    return from(listSupportedCurrencies()).pipe(
      filter(c => !blacklist.includes(c.id) && !c.isTestnetFor),
      map(currency =>
        defer(() =>
          getCurrencyBridge(currency)
            .scanAccounts({
              currency,
              deviceId: `speculos:nanos:${currency.id}`,
              syncConfig: {
                paginationConfig: {},
              },
            })
            .pipe(
              timeout({
                each: 200 * 1000,
                with: () => throwError(() => new Error("scan account timeout")),
              }),
              catchError(e => {
                console.error("scan accounts failed for " + currency.id, e);
                return from([]);
              }),
            ),
        ),
      ),
      mergeAll(5),
      filter(e => e.type === "discovered"),
      map(e => (accountFormatters[opts.format] || accountFormatters.default)(e.account)),
    );
  },
};
