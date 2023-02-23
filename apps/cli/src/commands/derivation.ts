import { of } from "rxjs";
import { listSupportedCurrencies } from "@ledgerhq/live-common/currencies/index";
import {
  getDerivationModesForCurrency,
  runDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import { setEnv, getEnv } from "@ledgerhq/live-common/env";
import { getAccountPlaceholderName } from "@ledgerhq/live-common/account/index";
export default {
  args: [],
  job: () =>
    of(
      listSupportedCurrencies()
        .map((currency) => {
          const value = getEnv("SCAN_FOR_INVALID_PATHS");
          setEnv("SCAN_FOR_INVALID_PATHS", true);
          const modes = getDerivationModesForCurrency(currency);
          setEnv("SCAN_FOR_INVALID_PATHS", value);
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
