import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "./transaction";
import BigNumber from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import { invalidMinimumAmountError } from "./bridge/utils/errors";

const SEED_IDENTIFIER =
  "020378080845446B50D7bFe2C450B5b24b8C586EfaF1aA051Feff4d12aD8f1eBF9E6";
const ACCOUNT_2 =
  "0203A17118eC0e64c4e4FdbDbEe0eA14D118C9aAf08C6c81bbB776Cae607cEB84EcB";

const casper: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "casper seed 1",
      apdus: `
      => 11010000142c000080fa010080000000800000000000000000
      <= 03a17118ec0e64c4e4fdbdbee0ea14d118c9aaf08c6c81bbb776cae607ceb84ecb30323033413137313138654330653634633465344664624462456530654131344431313843396141663038433663383162624237373643616536303763454238344563429000
      => 11010000142c000080fa010080000000800000000001000000
      <= 0378080845446b50d7bfe2c450b5b24b8c586efaf1aa051feff4d12ad8f1ebf9e630323033373830383038343534343642353044376246653243343530423562323462384335383645666146316141303531466566663464313261443866316542463945369000
      => 11010000142c000080fa010080000000800000000002000000
      <= 02664e3958608cd8dc2b80d4c73f18f76ef197f1cccca2f4f817c70bb050b248bd30323032363634653339353836303843643844633262383044344337334631384637364566313937663143634363413266346638313763373042623035304232343842449000
      => 11010000142c000080fa010080010000800000000000000000
      <= 03046705498ee223a1bf41ed23d9889fb5f2f711df2e14ef73a431594e75a4636130323033303436373035343938654532323361316266343165643233643938383946423566324637313164463245313445463733413433313539344537356134363336319000
      => 11010000142c000080fa010080020000800000000000000000
      <= 029644cc1ec96ea3faf36d483b7bde8c85393b9b34e602f184d8b559b526e474ed30323032393634344363314563393665413346414633364434383362374264653863383533393342396233344536303246313834643862353539623532364534373445649000
      => 11010000142c000080fa010080030000800000000000000000
      <= 02488e51a828423e59a45261c63c473d59419a8d7d2dc29fbadd9e8fee16d3988330323032343838453531613832383432334535394134353236314336336334373364353934313941386437443244633239666241644439453866456531366433393838339000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:casper:${SEED_IDENTIFIER}:casper_wallet`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Casper 1",
        derivationMode: "casper_wallet" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/506'/0'/0/1",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "casper",
        unitMagnitude: 9,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: "novalidaddress",
            amount: "1000",
            deploy: null,
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: ACCOUNT_2,
            amount: (300 * 1e9).toString(),
            deploy: null,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Amount Required",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: ACCOUNT_2,
            amount: "0",
            deploy: null,
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "Minimum Amount Required",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: ACCOUNT_2,
            amount: "1",
            deploy: null,
          }),

          expectedStatus: {
            errors: {
              amount: invalidMinimumAmountError(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "casper",
            recipient: ACCOUNT_2,
            amount: "3",
            deploy: null,
          }),
          expectedStatus: {
            amount: new BigNumber("3"),
            errors: {},
            warnings: {},
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    casper,
  },
};

testBridge(dataset);
