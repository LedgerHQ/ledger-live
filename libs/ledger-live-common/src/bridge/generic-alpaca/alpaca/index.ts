import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";

// NOTE: Using Api<any, any, any> to allow integration with coin-specific APIs like XRP (which use structured sender types).
export function getAlpacaApi(network: string, kind: "local" | "remote"): Api<any, any, any> {
  if (kind === "local") {
    // dynamic import ?
    switch (network) {
      case "xrp":
        return createXrpApi(
          getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple")),
        );
      // as unknown as Api<any>; // FIXME: createXrpApi returns a strongly typed Api<XrpSender>, fix Api<any> to allow it
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<Api<any, any, any>> as Api<any, any, any>;
}
