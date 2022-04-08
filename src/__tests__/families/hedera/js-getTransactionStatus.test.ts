import getTransactionStatus from "../../../families/hedera/js-getTransactionStatus";
import {
  AmountRequired,
  NotEnoughBalance,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import type { Account } from "../../../types";
import type { Transaction } from "../../../families/hedera/types";
import { AccountId } from "@hashgraph/sdk";

let account: Account;
let transaction: Transaction;
let data: {
  errors: Record<string, Error>;
  amount: BigNumber;
  estimatedFees: BigNumber;
  totalSpent: BigNumber;
  warnings: {};
};

describe("js-getTransactionStatus", () => {
  describe("getTransactionStatus errors", () => {
    beforeEach(() => resetTestData());

    test("RecipientRequired", async () => {
      transaction.recipient = "";

      const result = await getTransactionStatus(account, transaction);

      data.errors.recipient = new RecipientRequired("");

      expect(result).toEqual(data);
    });

    test("InvalidAddressBecauseDestinationIsAlsoSource", async () => {
      account.freshAddress = "0.0.3";
      transaction.recipient = "0.0.3";

      const result = await getTransactionStatus(account, transaction);

      data.errors.recipient = new InvalidAddressBecauseDestinationIsAlsoSource(
        ""
      );

      expect(result).toEqual(data);
    });

    test("InvalidAddress", async () => {
      transaction.recipient = "0.0.123x4";

      const result = await getTransactionStatus(account, transaction);

      data.errors.recipient = new InvalidAddress(
        `Error: failed to parse entity id: ${transaction.recipient}`
      );

      expect(result).toEqual(data);
    });

    test("NotEnoughBalance", async () => {
      account.balance = new BigNumber(-1);

      const result = await getTransactionStatus(account, transaction);

      data.errors.amount = new NotEnoughBalance("");

      expect(result).toEqual(data);
    });

    test("AmountRequired", async () => {
      transaction.amount = new BigNumber(0);

      const result = await getTransactionStatus(account, transaction);

      Object.assign(data, {
        errors: {
          amount: new AmountRequired(""),
        },
        amount: new BigNumber(0),
        totalSpent: new BigNumber(83300),
      });

      expect(result).toEqual(data);
    });
  });
});

function resetTestData(): void {
  account = {
    type: "Account",
    id: "",
    seedIdentifier: "0.0.3",
    derivationMode: "",
    index: 0,
    freshAddress: "",
    freshAddressPath: "",
    freshAddresses: [],
    name: "",
    starred: false,
    used: false,
    balance: new BigNumber(200000),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency: {
      type: "CryptoCurrency",
      id: "",
      managerAppName: "",
      coinType: 0,
      scheme: "",
      color: "",
      family: "",
      explorerViews: [],
      name: "",
      ticker: "",
      units: [],
    },
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    swapHistory: [],
    unit: {
      name: "",
      code: "",
      magnitude: 0,
      showAllDigits: undefined,
      prefixCode: undefined,
    },
  };

  transaction = {
    family: "hedera",
    amount: new BigNumber(1),
    recipient: "0.0.4",
  };

  data = {
    errors: {},
    amount: new BigNumber(1),
    estimatedFees: new BigNumber(83300),
    totalSpent: new BigNumber(83301),
    warnings: {},
  };
}
