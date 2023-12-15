import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { getAccountBridge } from "../../bridge";
import { decodeAccountId, encodeAccountId, fromAccountRaw } from "../../account";
import { BigNumber } from "bignumber.js";
import { AmountRequired, InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";

import type { DatasetTest, CurrenciesData } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "../filecoin/transaction";

const SEED_IDENTIFIER = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_1 = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_2 = "f410fncojwmrseefktoco6rcnb3zv2eiqfli7muhvqma";
const ACCOUNT_3 = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";
const ACCOUNT_4 = "f01840380";
const ACCOUNT_5 = "0x689c9b3232210aa9b84ef444d0ef35d11102ad1f";

const filecoin: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "filecoin seed 1",
      apdus: `
      => 0600000000
      <= 0000160500311000049000
      => 06010000142c000080cd010080000000800000000000000000
      <= 04ca7b02cafdf36e8b4caaf530a96b949764af71b956b2a3328b7a10940794c860f574a9199be98bde3c261887fec8e5fd94bc5f104908bf5f992f52ef2a89abb015017ff83e316c2605c018ab3a6126d5d8ce0a3023e529663170373464346d6c6d657963346167666c686a71736e766f797a796664616937666d6b79736f32619000
      => 0600000000
      <= 0000160500311000049000
      => 06010000142c00008001000080000000800000000000000000
      <= 04d493dab3ff63d6f0673454f8f6d6adec08db19e8c0298c65cfcace76a10757774afdee518b15a8b82452531bcb7860eefce02a89ef9051037646f5d4d6bd74171501eac14c6468ac13f66f0e0ee3766472c7e98394ab297431356c6175797a646976716a376d33796f623372786d7a6473793775796866666c777968657572699000
      => 0600000000
      <= 0000160500311000049000
      => 06010000142c00008001000080000000800000000001000000
      <= 040cbb57791d797268e34340565393f8a014ae754026159973fbe46bdcef3b6d28d155f4923256a2beb9bcff3bd39e5066d1c778306f28a2d4faa3a66dbf70453e150148c9b66fef1fce116652099bec6301ced31e56472974316a6465336d33377064376862637a737362676e36797979627a336a7234767368676370696b32619000
      => 0600000000
      <= 0000160500311000049000
      => 06010000142c000080cd010080000000800000000001000000
      <= 0419d91b4f9c3015637f5aa6b601b337f2770b1dcf93ba896d64627cd2aa67493ba924decd3024643478a84e06486b0a6b10d9f7607b6e92b0545bb3c998d4d75d15017ad86da94bab1ae1942e43050edb5f634b2d1ec9296631706c6d67336b6b6c766d6e6f6466626f696d6371357732376d6e66733268776a746173366769619000
      => 0600000000
      <= 0000160500311000049000
      => 06010000142c000080cd010080010000800000000000000000
      <= 0463c18e9a3c08ecffab4fa384f977e5d380d2b252dbbd96875df9cc91c44c81e82639fd659a3eeeaed96901696d8c7832b03befafd0af6ab2bee634ea8141e52a15016f62da10a416f416e80ec32866b91f01f7746af82966316e35726e75656665633332626e32616f796d75676e6f693761683378693278796e766c746e71699000
      `,
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:filecoin:${SEED_IDENTIFIER}:glif`,
        seedIdentifier: SEED_IDENTIFIER,
        name: "Filecoin 1",
        derivationMode: "glif" as const,
        index: 0,
        freshAddress: SEED_IDENTIFIER,
        freshAddressPath: "44'/461'/0'/0/0",
        freshAddresses: [],
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        currencyId: "filecoin",
        unitMagnitude: 18,
        lastSyncDate: "",
        balance: "1000",
      },
      transactions: [
        {
          name: "Not a valid address (fil)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: "novalidaddress",
            amount: "100000000",
          }),
          expectedStatus: {
            errors: {
              recipient: new InvalidAddress(),
            },
            warnings: {},
          },
        },
        {
          name: "Not a valid address (eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 100,
            gasPremium: "200",
            recipient: ACCOUNT_3 + "rr",
            amount: "100000000",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "100000000000000000000",
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
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "10",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "0",
          }),
          expectedStatus: {
            errors: {
              amount: new AmountRequired(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f1)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f0)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_4,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (0x eth)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_3,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount (f4)",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_2,
            amount: "1",
          }),
          expectedStatus: {
            amount: new BigNumber("1"),
            errors: {},
            warnings: {},
          },
        },
        {
          name: "Send max",
          transaction: fromTransactionRaw({
            family: "filecoin",
            method: 1,
            version: 1,
            nonce: 100,
            gasFeeCap: "1000",
            gasLimit: 10,
            gasPremium: "10000",
            recipient: ACCOUNT_1,
            amount: "1",
            useAllAmount: true,
          }),
          expectedStatus: (account, tx, status) => {
            return {
              amount: account.spendableBalance.minus(status.estimatedFees),
              errors: {},
              warnings: {},
            };
          },
        },
      ],
    },
  ],
};

const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    filecoin,
  },
};

testBridge(dataset);

describe("estimateMaxSpendable", () => {
  test("it should failed on invalid recipient", async () => {
    const accounts = dataset.currencies["filecoin"].accounts || [];
    const accountData = accounts[0];

    const account = fromAccountRaw({
      ...accountData.raw,
      id: encodeAccountId({
        ...decodeAccountId(accountData.raw.id),
        type: dataset.implementations[0],
      }),
    });

    const accountBridge = getAccountBridge(account);
    const estimate = async () => {
      await accountBridge.estimateMaxSpendable({
        account,
        transaction: { recipient: "notavalidrecipient" },
      });
    };

    await expect(estimate).rejects.toThrowError(new InvalidAddress());
  });
});
