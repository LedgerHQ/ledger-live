import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { createApi as createCantonApi } from "@ledgerhq/coin-canton/api/index";
import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { createApi as createTezosApi } from "@ledgerhq/coin-tezos/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { Api } from "@ledgerhq/coin-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";
import { findCryptoCurrencyByNetwork } from "../utils";

export function getAlpacaApi(network: string, kind: string): Api<any> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    switch (currency?.family) {
      case "xrp":
        return createXrpApi(getCurrencyConfiguration<XrpCoinConfig>(currency)) as Api<any>; // FIXME: createXrpApi returns a strongly typed Api<XrpSender>, fix Api<any> to allow it
      case "stellar":
        return createStellarApi(getCurrencyConfiguration<StellarCoinConfig>(currency)) as Api<any>;
      case "canton":
        return createCantonApi(getCurrencyConfiguration<CantonCoinConfig>(currency)) as Api<any>;
      case "tron":
        return createTronApi(getCurrencyConfiguration<TronCoinConfig>(currency)) as Api<any>;
      case "evm":
        return createEvmApi(
          getCurrencyConfiguration<EvmConfigInfo>(currency),
          currency.id,
        ) as Api<any>;
      case "tezos":
        return createTezosApi(getCurrencyConfiguration<TezosCoinConfig>(currency)) as Api<any>;
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<Api<any>>;
}
