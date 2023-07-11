import { CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { fromTransactionRaw } from "../transaction";
import BigNumber from "bignumber.js";

const dataset: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: ["cosmosResources", "operationsCount", "operations"],
  scanAccounts: [
    {
      name: "stargaze seed 1",
      apdus: `
      => 550400001a0573746172732c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e8373746172733167796175766c3434713261706e33753361756a6d333671387a726a37347672797079663279639000
      => 550400001a0573746172732c00008076000080000000800000000000000000
      <= 03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e8373746172733167796175766c3434713261706e33753361756a6d333671387a726a37347672797079663279639000
      => 550400001a0573746172732c00008076000080010000800000000000000000
      <= 02c8f29e73a2c99d11de0544615a87afc6c6575d22746af18a8ef733066f088b1f73746172733176326d70306d376b3936646d3971763630666b737063716c7a706b7a72776e656b657973386c9000
      `,
    },
  ],
  accounts: [
    {
      FIXME_tests: ["balance is sum of ops"],
      raw: {
        id: "js:2:stargaze:stars1gyauvl44q2apn3u3aujm36q8zrj74vrypyf2yc:",
        seedIdentifier: "03d5e0ebb3f1ae2afe87e5d5a24b5029a59cc12f8fd1056840091b2f0b97e54e83",
        name: "Stargaze 1",
        starred: false,
        used: true,
        derivationMode: "",
        index: 0,
        freshAddress: "stars1gyauvl44q2apn3u3aujm36q8zrj74vrypyf2yc",
        freshAddressPath: "44'/118'/0'/0/0",
        freshAddresses: [],
        blockHeight: 8631468,
        creationDate: "2023-06-12T13:26:55.000Z",
        operationsCount: 1,
        operations: [],
        pendingOperations: [],
        currencyId: "stargaze",
        unitMagnitude: 6,
        lastSyncDate: "2023-06-12T13:27:26.351Z",
        balance: "2000000",
        spendableBalance: "2000000",
        balanceHistoryCache: {
          HOUR: { balances: [0], latestDate: 1686574800000 },
          DAY: { balances: [0], latestDate: 1686520800000 },
          WEEK: { balances: [0], latestDate: 1686434400000 },
        },
        xpub: "stars1gyauvl44q2apn3u3aujm36q8zrj74vrypyf2yc",
        swapHistory: [],
      },
      transactions: [
        {
          name: "Normal transaction",
          transaction: fromTransactionRaw({
            amount: "100000",
            recipient: "stars1sntx5sf6w933f8pytpr2dh9sxns0u23m7tcdxx",
            useAllAmount: false,
            family: "cosmos",
            mode: "send",
            networkInfo: null,
            fees: "8744",
            gas: "87440",
            validators: [],
            memo: "",
            sourceValidator: "",
          }),
          expectedStatus: () => ({
            errors: {},
            warnings: {},
            amount: BigNumber("100000"),
          }),
        },
      ],
    },
  ],
};

export default dataset;
