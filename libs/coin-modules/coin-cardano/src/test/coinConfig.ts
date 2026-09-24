import type { CardanoCoinConfig, CardanoInfra } from "../config";

/** The endpoints the app ships by default, one entry per currency. */
export const infraByCurrency: Record<string, CardanoInfra> = {
  cardano: {
    CARDANO_API_ENDPOINT: "https://cardano.coin.ledger.com/api",
    CARDANO_EPOCH_PARAMS_ENDPOINT: "https://ada.api.live.ledger.com/api/rest/params",
  },
  cardano_testnet: {
    CARDANO_API_ENDPOINT: "https://ledger-preprod.cardanoscan.io/api",
    CARDANO_EPOCH_PARAMS_ENDPOINT: "https://ada-testnet.api.live.ledger-test.com/api/rest/params",
  },
};

/** The resolved mainnet config, for tests that call the network/logic layers directly. */
export const mockCardanoConfig: CardanoCoinConfig = {
  status: { type: "active" },
  maxFeesWarning: 5000000,
  maxFeesError: 10000000,
  infra: infraByCurrency.cardano,
};

/** The resolved preprod config, for integration tests that hit the Cardano testnet. */
export const mockCardanoTestnetConfig: CardanoCoinConfig = {
  ...mockCardanoConfig,
  infra: infraByCurrency.cardano_testnet,
};
