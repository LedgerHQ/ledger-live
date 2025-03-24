import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";

export function getAlpacaApi(network: string, kind: "local" | "remote"): Api<any> {
  if (kind === "local") {
    switch (network) {
      case "xrp":
      case "ripple":
        return createXrpApi(
          getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple")),
        );
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<Api<any>> as Api<any>;
}
