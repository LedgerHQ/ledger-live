import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";

export function getAlpacaApi(network: string, kind: "local" | "remote"): Api<any, any> {
  if (kind === "local") {
    switch (network) {
      case "ripple":
      case "xrp":
        return createXrpApi(
          getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple")),
        ) as Api<any, any>;
      // as unknown as Api<any>; // FIXME: createXrpApi returns a strongly typed Api<XrpSender>, fix Api<any> to allow it
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<Api<any, any>> as Api<any, any>;
}
