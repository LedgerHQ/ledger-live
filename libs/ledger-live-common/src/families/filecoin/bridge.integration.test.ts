import "../../__tests__/test-helpers/setup";
import { testBridge } from "../../__tests__/test-helpers/bridge";
import { getAccountBridge } from "../../bridge";
import {
  decodeAccountId,
  encodeAccountId,
  fromAccountRaw,
} from "../../account";
import { BigNumber } from "bignumber.js";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
} from "@ledgerhq/errors";
import type { DatasetTest } from "../../types";
import type { Transaction } from "./types";
import { fromTransactionRaw } from "../filecoin/transaction";
import { CurrenciesData } from "../../types";

const SEED_IDENTIFIER = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";
const ACCOUNT_1 = "f1p74d4mlmeyc4agflhjqsnvoyzyfdai7fmkyso2a";

const filecoin: CurrenciesData<Transaction> = {
  FIXME_ignoreAccountFields: [],
  scanAccounts: [
    {
      name: "filecoin seed 1",
      apdus: `
      => 0600000000
      <= 0000160500311000049000
      => 06010000142c000080cd010080000000800000000000000000
      <= 04ca7b02cafdf36e8b4caaf530a96b949764af71b956b2a3328b7a10940794c860f574a9199be98bde3c261887fec8e5fd94bc5f104908bf5f992f52ef2a89abb015017ff83e316c2605c018ab3a6126d5d8ce0a3023e529663170373464346d6c6d657963346167666c686a71736e766f797a796664616937666d6b79736f32619000
      => 0600000000
      <= 0000160200330000049000
      => 06010000142c00008001000080000000800000000000000000
      <= 04433296b4adc4c68ae79f6ed6ff1b09875c932d993a20dd068b07346c2dcefe42a791287afae0932dea2ded54982e9a4ca38e614a60f320c68ddb554949953094150111b66c4555016c4ea8677f4d71c954a869790d1a2974316367336779726b7661667765356b64687035677864736b757662757873646932686e7377646d699000
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
      FIXME_tests: ["balance is sum of ops"],
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
          name: "Not a valid address",
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
          name: "New account and sufficient amount",
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
