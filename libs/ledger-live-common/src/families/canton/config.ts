import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const cantonConfig: Record<string, ConfigInfo> = {
  config_currency_canton_network: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: "https://canton-gateway.api.live.ledger.com/v1/node/ledger-live-mainnet",
      nodeId: "ledger-live-mainnet",
      gatewayUrl: "https://canton-gateway.api.live.ledger.com",
      minReserve: 0,
      useGateway: true,
      networkType: "mainnet",
      nativeInstrumentId: "Amulet",
      fee: 0,
    },
  },
  config_currency_canton_network_devnet: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: "https://canton-gateway.api.live.ledger.com/v1/node/ledger-live-devnet",
      nodeId: "ledger-live-devnet",
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      minReserve: 0,
      useGateway: true,
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
      fee: 0,
    },
  },
  config_currency_canton_network_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      nodeUrl: "https://canton-gateway.api.live.ledger.com/v1/node/ledger-live-testnet",
      nodeId: "ledger-live-testnet",
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      minReserve: 0,
      nativeInstrumentId: "Amulet",
      useGateway: true,
      networkType: "testnet",
      fee: 0,
    },
  },
};
