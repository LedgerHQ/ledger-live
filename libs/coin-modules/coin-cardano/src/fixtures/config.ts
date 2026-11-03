import type { CardanoCoinConfig } from "../config";

export const cardanoCoinConfig: CardanoCoinConfig = {
  status: { type: "active" },
  name: "Cardano",
  unit: { name: "ada", code: "ADA", magnitude: 6 },
  maxFeesWarning: 0,
  maxFeesError: 0,
  testnet: false,
  infra: { CARDANO_API_ENDPOINT: "https://cardano.coin.ledger.com/api" },
};

export const cardanoTestnetCoinConfig: CardanoCoinConfig = {
  ...cardanoCoinConfig,
  name: "Cardano Testnet",
  testnet: true,
  infra: { CARDANO_API_ENDPOINT: "https://ledger-preprod.cardanoscan.io/api" },
};
