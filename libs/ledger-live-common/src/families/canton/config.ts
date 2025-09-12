import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const cantonConfig: Record<string, ConfigInfo> = {
  config_currency_canton_network: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      // TBC
      nodeUrl: "https://wallet-validator-canton.ledger.com",
      nodeId: "ledger-live-mainnet-prd",
      gatewayUrl: "https://canton-gateway.api.live.ledger.com",
      minReserve: 0,
      useGateway: true,
      networkType: "mainnet",
    },
  },
  config_currency_canton_network_devnet: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: "https://wallet-validator-devnet-canton.ledger-test.com",
      nodeId: "ledger-devnet-stg",
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      minReserve: 0,
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
    },
  },
  config_currency_canton_network_localnet: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: "http://localhost:2975/v2",
      nodeId: undefined,
      gatewayUrl: undefined,
      minReserve: 0,
      useGateway: false,
      networkType: "localnet",
    },
  },
};
