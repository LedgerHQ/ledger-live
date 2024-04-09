import { InvalidAddress, NotEnoughBalance } from "@ledgerhq/errors";
import { CurrenciesData, DatasetTest } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TonCommentInvalid } from "./errors";
import { fromTransactionRaw } from "./transaction";
import { Transaction } from "./types";

const PUBKEY = "86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a060";
const ADDRESS = "UQCOvQLYvTcbi5tL9MaDNzuVl3-J3vATimNm9yO5XPafLfV4";
const ADDRESS_2 = "UQAui6M4jOYOezUGfmeONA22Ars9yjd34YIGdAR1Pcpp4sgR";
const PATH = "44'/607'/0'/0'/0'/0'";

const ton: CurrenciesData<Transaction> = {
  scanAccounts: [
    {
      name: "ton seed 1",
      apdus: `
      => e005000019068000002c8000025f80000000800000008000000080000000
      <= 86196cb40cd25e9e696bc808e3f2c074ce0b39f2a2a9d482a68eafef86e4a0609000
      => e005000019068000002c8000025f80000000800000008000000180000000
      <= b5177c2b32f9d72fa8c673cc3d61acec6a9f68eb5e4945445fdbb48a45eb48879000
      `,
      test: (expect, accounts) => {
        for (const account of accounts) {
          expect(account.derivationMode).toEqual("ton");
        }
      },
    },
  ],
  accounts: [
    {
      raw: {
        id: `js:2:ton:${PUBKEY}:ton`,
        currencyId: "ton",
        seedIdentifier: PUBKEY,
        name: "TON 1",
        derivationMode: "ton",
        index: 0,
        freshAddress: ADDRESS,
        freshAddressPath: PATH,
        freshAddresses: [
          {
            address: ADDRESS,
            derivationPath: PATH,
          },
        ],
        xpub: PUBKEY,
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        unitMagnitude: 9,
        lastSyncDate: "",
        balance: "5000000000",
      },
      transactions: [
        {
          name: "Not a valid address",
          transaction: fromTransactionRaw({
            family: "ton",
            recipient: "novalidaddress",
            fees: "10000000",
            amount: "1000",
            comment: { isEncrypted: false, text: "" },
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
            family: "ton",
            recipient: ADDRESS_2,
            fees: "10000000",
            amount: (300 * 1e9).toString(),
            comment: { isEncrypted: false, text: "" },
          }),
          expectedStatus: {
            errors: {
              amount: new NotEnoughBalance(),
            },
            warnings: {},
          },
        },
        {
          name: "Invalid transferID/Memo",
          transaction: fromTransactionRaw({
            family: "ton",
            recipient: ADDRESS_2,
            fees: "10000000",
            amount: (1 * 1e9).toString(),
            comment: { isEncrypted: false, text: "😀" },
          }),
          expectedStatus: {
            errors: {
              comment: new TonCommentInvalid(),
            },
            warnings: {},
          },
        },
        {
          name: "New account and sufficient amount",
          transaction: fromTransactionRaw({
            family: "ton",
            recipient: ADDRESS_2,
            fees: "10000000",
            amount: "10000000",
            comment: { isEncrypted: false, text: "Valid" },
          }),
          expectedStatus: {
            amount: new BigNumber("10000000"),
            errors: {},
            warnings: {},
          },
        },
      ],
    },
  ],
};

export const dataset: DatasetTest<Transaction> = {
  implementations: ["js"],
  currencies: {
    ton,
  },
};

describe("Ton bridge", () => {
  test.todo(
    "This is an empty test to make jest command pass. Remove it once there is a real test.",
  );
});

/**
 * NOTE: if tests are added to this file,
 * like done in libs/coin-polkadot/src/bridge.integration.test.ts for example,
 * this file fill need to be imported in ledger-live-common
 * libs/ledger-live-common/src/families/ton/bridge.integration.test.ts
 * like done for polkadot.
 * cf.
 * - libs/coin-polkadot/src/bridge.integration.test.ts
 * - libs/ledger-live-common/src/families/polkadot/bridge.integration.test.ts
 */
