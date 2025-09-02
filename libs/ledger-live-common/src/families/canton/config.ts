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
      nodeId: "figment",
      // TBC
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
      nativeInstrumentId:
        "6e9fc50fb94e56751b49f09ba2dc84da53a9d7cff08115ebb4f6b7a12d0c990c:Splice.Amulet:Amulet",
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
