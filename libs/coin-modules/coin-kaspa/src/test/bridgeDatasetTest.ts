import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { Transaction } from "../types";

const kaspa: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "kaspa seed 1",
      apdus: `
      => e00500000d038000002c8001b20780000000
      <= 41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a55769000
      => e00500000d038000002c8001b20780000001
      <= 4104751b5ebd4a9d2a0a25d5c37cab4814a95335b8945cfcaa6a4138de418f581bb1d0d02f22081b3cda223a51e18a63ebdffd64803e0988b68a91802738a5a9f901206d4a2b989a82b5fb160f0151ea5d046451a291a0748f3038ecdc63d637cce00b9000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: "js:2:kaspa:41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a5576:",
        seedIdentifier: "41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a5576",
        derivationMode: "",
        currencyId: "kaspa",
        pendingOperations: [],
        xpub: "41049d8002c08041d975ab58491c09cf8ced7b388a114ab2f5df73f2534d4d74d17ab8913b3cb3056bad63141cb63fb92e44401b691dee069dbdb2119861c18cc01b204340fcc305ab72e752cd347f4b6271ffe21da098d4f2a4749826857dda7a5576",
        lastSyncDate: "",
        index: 0,
        blockHeight: 194187965,
        balance: "13370000",
        spendableBalance: "13370000",
        operations: [],
        operationsCount: 1,
        freshAddress: "kaspa:qz49rpg0q6ywewxkwl76757ya79v6j556hcmrcy7mk9d36ewgp80cdrwlct2h",
        freshAddressPath: "44'/111111'/0'/0/1",
        used: true,
      },
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    kaspa,
  },
};
