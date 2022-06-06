import { fromTransactionRaw } from "./transaction";

import type { AccountRaw, DatasetTest } from "../../types";
import type { Transaction } from "./types";

const makeAccount = (): AccountRaw => {
  return {
    id: "js:2:osmo:osmo1g84934jpu3v5de5yqukkkhxmcvsw3u2a6al3md:",
    seedIdentifier:
      "0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a",
    name: "Osmosis 1",
    derivationMode: "",
    index: 0,
    freshAddress: "osmo1g84934jpu3v5de5yqukkkhxmcvsw3u2a6al3md",
    freshAddressPath: "44'/118'/0'/0/0",
    freshAddresses: [],
    blockHeight: 4693537,
    operationsCount: 1,
    operations: [],
    pendingOperations: [],
    currencyId: "osmo",
    unitMagnitude: 6,
    lastSyncDate: "2022-06-06T15:35:18.079Z",
    balance: "400000",
    spendableBalance: "400000",
  };
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    osmosis: {
      scanAccounts: [
        {
          name: "osmo seed 1",
          apdus: `
            => 5504000019046f736d6f2c00008076000080000000800000000000000000
            <= 0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a6f736d6f316738343933346a70753376356465357971756b6b6b68786d637673773375326136616c336d649000
            => 5504000019046f736d6f2c00008076000080000000800000000000000000
            <= 0388459b2653519948b12492f1a0b464720110c147a8155d23d423a5cc3c21d89a6f736d6f316738343933346a70753376356465357971756b6b6b68786d637673773375326136616c336d649000
            => 5504000019046f736d6f2c00008076000080010000800000000000000000
            <= 02624ac83690d5ef627927104767d679aef73d3d3c9544abe4206b1d0c463c94ff6f736d6f31303875793571396a743539677775677135797264686b7a6364396a7279736c6d6672726d71789000
            => 5504000019046f736d6f2c00008076000080020000800000000000000000
            <= 038ff98278402aa3e46ccfd020561dc9724ab63d7179ca507c8154b5257c7d52006f736d6f3163676336393661793270673664346763656a656b3279386c6136366a37653579657264786a759000
            `,
        },
      ],
      accounts: [
        {
          raw: makeAccount(),
        },
      ],
    },
  },
};

export default dataset;
