import { InvalidAddressBecauseDestinationIsAlsoSource, NotEnoughBalance } from "@ledgerhq/errors";
import type { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

import { fromTransactionRaw } from "./transaction";
import type { Transaction } from "./types";

const TEST_ADDRESS = "erd1vgfp3g7azqjx4wsmtt7067m0l62v3psmqzr24j6xvywj2tlz0gesvyzsq2";

const multiversx: CurrenciesData<Transaction> = {
  FIXME_ignorePreloadFields: [
    "validators", // They are always changing
  ],
  scanAccounts: [
    {
      name: "multiversx seed 1",
      apdus: `
    => ed030000080000000080000000
    <= 3e6572643176676670336737617a716a783477736d7474373036376d306c3632763370736d717a7232346a36787679776a32746c7a3067657376797a7371329000
    => ed030000080000000080000000
    <= 3e6572643176676670336737617a716a783477736d7474373036376d306c3632763370736d717a7232346a36787679776a32746c7a3067657376797a7371329000
    => ed030000080000000080000001
    <= 3e65726431706d33676a65326c6d643576796c6463767579366a7078676465347261706a70756a76756a6b65653661376a77327a6d6834747172653739367a9000
    `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:multiversx:${TEST_ADDRESS}:`,
        seedIdentifier: `${TEST_ADDRESS}`,
        name: "MultiversX 1",
        derivationMode: "",
        index: 0,
        freshAddress: `${TEST_ADDRESS}`,
        freshAddressPath: "44'/508'/0'/0'/0'",
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "elrond",
        lastSyncDate: "",
        balance: "299569965",
        subAccounts: [
          {
            // MEX account
            id: `js:2:multiversx:${TEST_ADDRESS}:+4d45582d343535633537`,
            balance: "100",
            spendableBalance: "100",
            type: "TokenAccountRaw",
            tokenId: "multiversx/esdt/4d45582d343535633537",
            parentId: `js:2:multiversx:${TEST_ADDRESS}:`,
            operations: [],
            pendingOperations: [],
          },
        ],
      },
      transactions: [
        {
          name: "recipient and sender must not be the same",
          transaction: fromTransactionRaw({
            family: "multiversx",
            recipient: `${TEST_ADDRESS}`,
            amount: "100000000",
            mode: "send",
            fees: null,
            gasLimit: 50000000,
          }),
          expectedStatus: {
            amount: new BigNumber("100000000"),
            errors: {
              recipient: new InvalidAddressBecauseDestinationIsAlsoSource(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance",
          transaction: fromTransactionRaw({
            family: "multiversx",
            recipient: "erd1frj909pfums4m8aza596595l9pl56crwdj077vs2aqcw6ynl28wsfkw9rd",
            amount: "1000000000000000000000000",
            mode: "send",
            fees: null,
            gasLimit: 50000000,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Not enough balance (ESDT transfer)",
          transaction: fromTransactionRaw({
            family: "multiversx",
            recipient: "erd1frj909pfums4m8aza596595l9pl56crwdj077vs2aqcw6ynl28wsfkw9rd",
            amount: "1000000000000000000000000",
            mode: "send",
            fees: null,
            gasLimit: 50000000,
            subAccountId: `js:2:multiversx:${TEST_ADDRESS}:+4d45582d343535633537`,
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "multiversx",
            recipient: "erd1frj909pfums4m8aza596595l9pl56crwdj077vs2aqcw6ynl28wsfkw9rd",
            useAllAmount: true,
            amount: "0",
            mode: "send",
            fees: null,
            gasLimit: 50000000,
          }),
          expectedStatus: (account, _, status) => {
            return {
              amount: account.balance.minus(status.estimatedFees),
              warnings: {},
              errors: {},
            };
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    multiversx,
  },
};

describe("MultiversX bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});
