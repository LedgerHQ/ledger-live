import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { createApi as createTezosApi } from "@ledgerhq/coin-tezos/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";

export function getAlpacaApi(network, kind): Api<any> {
  if (kind === "local") {
    switch (network) {
      case "ripple":
      case "xrp":
        return createXrpApi(
          getCurrencyConfiguration<XrpCoinConfig>(getCryptoCurrencyById("ripple")),
        ) as Api<any>; // FIXME: createXrpApi returns a strongly typed Api<XrpSender>, fix Api<any> to allow it
      case "stellar":
        return createStellarApi(
          getCurrencyConfiguration<StellarCoinConfig>(getCryptoCurrencyById("stellar")),
        ) as Api<any>;
      case "tezos":
        return createTezosApi(
          getCurrencyConfiguration<TezosCoinConfig>(getCryptoCurrencyById("tezos")),
        ) as Api<any>;
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<Api<any>> as Api<any>;
}
