import { cardanoDefaults, type CardanoCoinConfig, type CardanoContext } from "../config";

export const cardanoCoinConfig: CardanoCoinConfig = {
  status: { type: "active" },
  name: "Cardano",
  unit: { name: "ada", code: "ADA", magnitude: 6 },
  maxFeesWarning: 0,
  maxFeesError: 0,
  fees: cardanoDefaults.cardano.fees,
  validators: cardanoDefaults.cardano.validators,
  testnet: false,
  api: cardanoDefaults.cardano.api,
  epochParams: cardanoDefaults.cardano.epochParams,
};

export const cardanoTestnetCoinConfig: CardanoCoinConfig = {
  ...cardanoCoinConfig,
  name: "Cardano Testnet",
  testnet: true,
  api: cardanoDefaults.cardano_testnet.api,
  epochParams: cardanoDefaults.cardano_testnet.epochParams,
};

/** A context resolving `cardano_testnet` to the testnet fixture and any other id to mainnet. */
export const createMockContext = (
  resolve: (currencyId?: string) => CardanoCoinConfig = currencyId =>
    currencyId === "cardano_testnet" ? cardanoTestnetCoinConfig : cardanoCoinConfig,
): CardanoContext => ({
  config: async currencyId => resolve(currencyId),
  logger: () => {},
});
