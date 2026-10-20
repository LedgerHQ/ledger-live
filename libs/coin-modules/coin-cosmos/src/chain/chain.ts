import cosmosCoinConfig, { type CosmosCoinConfig } from "../config";
import Axelar from "./Axelar";
import Babylon from "./Babylon";
import BinanceBeaconChain from "./BinanceBeaconChain";
import Coreum from "./Coreum";
import Cosmos from "./Cosmos";
import CryptoOrg from "./CryptoOrg";
import Desmos from "./Desmos";
import Dydx from "./Dydx";
import Gonka from "./Gonka";
import Injective from "./Injective";
import Mantra from "./Mantra";
import Nyx from "./Nyx";
import Osmosis from "./Osmosis";
import Persistence from "./Persistence";
import SecretNetwork from "./SecretNetwork";
import Stargaze from "./Stargaze";
import Stride from "./Stride";
import Xion from "./Xion";
import CosmosBase from "./cosmosBase";

const cosmosChainParams: { [key: string]: CosmosBase } = {};

const CURRENCY_ID_ALIASES: Record<string, string> = {
  osmosis: "osmo",
  crypto_org_croeseid: "crypto_org", // croeseid testnet reuses crypto_org's params
};

export const resolveChainCurrencyId = (currencyId: string): string =>
  CURRENCY_ID_ALIASES[currencyId] ?? currencyId;

function createChain(currencyId: string): CosmosBase {
  switch (currencyId) {
    case "osmo":
      return new Osmosis();
    case "cosmos":
      return new Cosmos();
    case "axelar":
      return new Axelar();
    case "binance_beacon_chain":
      return new BinanceBeaconChain();
    case "desmos":
      return new Desmos();
    case "dydx":
      return new Dydx();
    case "nyx":
      return new Nyx();
    case "persistence":
      return new Persistence();
    case "secret_network":
      return new SecretNetwork();
    case "stargaze":
      return new Stargaze();
    case "stride":
      return new Stride();
    case "coreum":
      return new Coreum();
    case "injective":
      return new Injective();
    case "mantra":
      return new Mantra();
    case "crypto_org":
      return new CryptoOrg();
    case "xion":
      return new Xion();
    case "babylon":
      return new Babylon();
    case "gonka":
      return new Gonka();
    default:
      throw new Error(`${currencyId} is not supported`);
  }
}

export default function cryptoFactory(currencyId: string, config?: CosmosCoinConfig): CosmosBase {
  currencyId = resolveChainCurrencyId(currencyId);
  // An explicit config bypasses the shared cache so it is never shadowed by an earlier call.
  if (config) return { ...createChain(currencyId), ...config } as CosmosBase;

  if (!cosmosChainParams[currencyId]) {
    const chain = createChain(currencyId);

    try {
      const coinConfig = cosmosCoinConfig.getCoinConfig(currencyId);
      cosmosChainParams[currencyId] = coinConfig
        ? ({ ...chain, ...coinConfig } as CosmosBase)
        : chain;
    } catch {
      // coinConfig not yet initialized (bridges not loaded) — return defaults without caching
      // so enrichment is retried on the next call once bridges are set up
      return chain;
    }
  }

  return cosmosChainParams[currencyId];

  // TODO: Currently, all cosmos currencies listed in the cosmos loader's supportedCoins must be supported here. We are working on a new way to support/enable new currencies
}
