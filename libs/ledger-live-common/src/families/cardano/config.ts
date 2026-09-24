import { CardanoCoinConfig } from "@ledgerhq/coin-cardano/config";
import { CurrencyLiveConfigDefinition } from "../../config";

export const cardanoConfig: CurrencyLiveConfigDefinition = {
  config_currency_cardano: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      maxFeesWarning: 5e6,
      maxFeesError: 10e6,
      infra: {
        CARDANO_API_ENDPOINT: "https://cardano.coin.ledger.com/api",
        CARDANO_EPOCH_PARAMS_ENDPOINT: "https://ada.api.live.ledger.com/api/rest/params",
      },
    } as CardanoCoinConfig,
  },
  config_currency_cardano_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      maxFeesWarning: 5e6,
      maxFeesError: 10e6,
      infra: {
        CARDANO_API_ENDPOINT: "https://ledger-preprod.cardanoscan.io/api",
        CARDANO_EPOCH_PARAMS_ENDPOINT:
          "https://ada-testnet.api.live.ledger-test.com/api/rest/params",
      },
    } as CardanoCoinConfig,
  },
};
