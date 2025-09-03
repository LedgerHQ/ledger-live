import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { createApi as createCantonApi } from "@ledgerhq/coin-canton/api/index";
import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";

export function getAlpacaApi(network, kind): Api<any> {
  const currency = getCryptoCurrencyById(network);
  if (kind === "local") {
    switch (network) {
      case "ripple":
      case "xrp":
        return createXrpApi(getCurrencyConfiguration<XrpCoinConfig>(currency)) as Api<any>; // FIXME: createXrpApi returns a strongly typed Api<XrpSender>, fix Api<any> to allow it
      case "stellar":
        return createStellarApi(getCurrencyConfiguration<StellarCoinConfig>(currency)) as Api<any>;
      case "canton_network_localnet":
      case "canton_network_devnet":
      case "canton_network_mainnet":
        return createCantonApi(getCurrencyConfiguration<CantonCoinConfig>(currency)) as Api<any>;
      case "tron":
        return createTronApi(getCurrencyConfiguration<TronCoinConfig>(currency)) as Api<any>;
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<Api<any>> as Api<any>;
}
