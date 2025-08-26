import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import { getNetworkLamaApi } from "../lama/network-lama";

export function getAlpacaApi(network, kind, address: string, pubKey: string): Api<any> {
  switch (kind) {
    case "local":
      switch (network) {
        case "xrp":
          return createXrpApi(
            getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple")),
          ) as Api<any>; // FIXME: createXrpApi returns a strongly typed Api<XrpSender>, fix Api<any> to allow it
        case "stellar":
          return createStellarApi(
            getCurrencyConfiguration<StellarCoinConfig>(getCryptoCurrencyById("stellar")),
          ) as Api<any>;
        default:
          throw new Error("Network not supported for local Alpaca API: " + network);
      }
    case "lama":
      return getNetworkLamaApi(network, address, pubKey) satisfies Partial<Api<any>> as Api<any>;
    default:
      return getNetworkAlpacaApi(network) satisfies Partial<Api<any>> as Api<any>;
  }
}
