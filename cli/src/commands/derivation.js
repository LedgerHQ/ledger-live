// @flow

import { of } from "rxjs";
import { listSupportedCurrencies } from "@ledgerhq/live-common/lib/currencies";
import {
  getDerivationModesForCurrency,
  runDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import { setEnv } from "@ledgerhq/live-common/lib/env";
import { getAccountPlaceholderName } from "@ledgerhq/live-common/lib/account";

setEnv("SCAN_FOR_INVALID_PATHS", true);

export default {
  args: [],
  job: () =>
    of(
      listSupportedCurrencies()
        .map((currency) => {
          const modes = getDerivationModesForCurrency(currency);
          return modes
            .map((derivationMode) => {
              const scheme = getDerivationScheme({
                derivationMode,
                currency,
              });
              const path = runDerivationScheme(scheme, currency, {
                account: "<account>",
                node: "<change>",
                address: "<address>",
              });
              return (
                "  " +
                (derivationMode || "default") +
                ": " +
                getAccountPlaceholderName({
                  currency,
                  index: 0,
                  derivationMode,
                }) +
                ": " +
                path
              );
            })
            .join("\n");
        })
        .join("\n")
    ),
};
