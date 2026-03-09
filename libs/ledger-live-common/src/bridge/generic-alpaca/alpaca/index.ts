import { createApi as createXrpApi } from "@ledgerhq/coin-xrp/api/index";
import { createApi as createStellarApi } from "@ledgerhq/coin-stellar/api/index";
import { createApi as createCantonApi } from "@ledgerhq/coin-canton/api/index";
import { createApi as createTronApi } from "@ledgerhq/coin-tron/api/index";
import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import { createApi as createTezosApi } from "@ledgerhq/coin-tezos/api/index";
import { getCurrencyConfiguration } from "../../../config";
import { getNetworkAlpacaApi } from "./network/network-alpaca";
import { AlpacaApi } from "@ledgerhq/coin-module-framework/api/types";
import { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { XrpCoinConfig } from "@ledgerhq/coin-xrp/config";
import { StellarCoinConfig } from "@ledgerhq/coin-stellar/config";
import { CantonCoinConfig } from "@ledgerhq/coin-canton/config";
import { TronCoinConfig } from "@ledgerhq/coin-tron/config";
import { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";
import { findCryptoCurrencyByNetwork } from "../utils";

export function getAlpacaApi(network: string, kind: string): AlpacaApi<any> & BridgeApi<any> {
  if (kind === "local") {
    const currency = findCryptoCurrencyByNetwork(network);
    switch (currency?.family) {
      case "xrp":
        return createXrpApi(getCurrencyConfiguration<XrpCoinConfig>(currency)) as AlpacaApi<any> &
          BridgeApi<any>; // FIXME: createXrpApi returns a strongly typed AlpacaApi<XrpSender> & BridgeApi<XrpSender>
      case "stellar":
        return createStellarApi(
          getCurrencyConfiguration<StellarCoinConfig>(currency),
        ) as AlpacaApi<any> & BridgeApi<any>;
      case "canton":
        return createCantonApi(
          getCurrencyConfiguration<CantonCoinConfig>(currency),
        ) as AlpacaApi<any> & BridgeApi<any>;
      case "tron":
        return createTronApi(getCurrencyConfiguration<TronCoinConfig>(currency)) as AlpacaApi<any> &
          BridgeApi<any>;
      case "evm":
        return createEvmApi(
          getCurrencyConfiguration<EvmConfigInfo>(currency),
          currency.id,
        ) as AlpacaApi<any> & BridgeApi<any>;
      case "tezos":
        return createTezosApi(
          getCurrencyConfiguration<TezosCoinConfig>(currency),
        ) as AlpacaApi<any> & BridgeApi<any>;
    }
  }
  return getNetworkAlpacaApi(network) satisfies Partial<AlpacaApi<any> & BridgeApi<any>>;
}
