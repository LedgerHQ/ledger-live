import type { DatasetTest } from "../../types";
import type { Transaction } from "./types";

// NOTE: Still a WIP

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    hedera: {
      scanAccounts: [
        {
          name: "hedera seed 1",
          apdus: `
            => e002010015000000002c00000bd6000000000000000000000000
            <= 9eb51b624570e206cb2d727a106991c8fe824d133156f1fd570091c66190c7cd9000
            `,
        },
      ],
      accounts: [
        {
          raw: {
            id: `js:2:hedera:0.0.629470:`,
            seedIdentifier: "",
            name: "Hedera 1",
            derivationMode: "",
            index: 0,
            freshAddress: "",
            freshAddressPath: "44/3030/0/0/0",
            freshAddresses: [],
            blockHeight: 0,
            operations: [],
            pendingOperations: [],
            currencyId: "hedera",
            unitMagnitude: 8,
            lastSyncDate: "",
            balance: "0",
          },
          transactions: [
            // HERE WE WILL INSERT OUR test
          ],
        },
      ],
    },
  },
};

export default dataset;
