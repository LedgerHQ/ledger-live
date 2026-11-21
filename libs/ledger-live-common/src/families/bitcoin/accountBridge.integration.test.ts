import "../../__tests__/test-helpers/setup.integration";
import BigNumber from "bignumber.js";
import { lastValueFrom } from "rxjs";
import { getOperationAmountNumber } from "@ledgerhq/ledger-wallet-framework/operation";
import type { BitcoinAccount, Transaction } from "@ledgerhq/coin-bitcoin/types";
import { bridge } from "./setup";
import {
  isBitcoinAccount,
  restoreBitcoinAccount,
  restoreFromXpubOnly,
  scanWithRecordedDevice,
} from "./fixtures/scanAccounts.helpers";

type Recipients = { legacy: string; segwit: string; nativeSegwit: string };

const CURRENCIES: Array<{ id: string; feePerByte: number; recipients: Recipients }> = [
  {
    id: "bitcoin",
    feePerByte: 1,
    recipients: {
      legacy: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
      segwit: "34N7XoKANmM66ZQDyQf2j8hPaTo6v5X8eA",
      nativeSegwit: "BC1QQMXQDRKXGX6SWRVJL9L2E6SZVVKG45ALL5U4FL",
    },
  },
  {
    id: "digibyte",
    feePerByte: 1,
    recipients: {
      legacy: "DMtVdcKhnbntP1dSYYmSFNg8GK1T8aCwCb",
      segwit: "Sb4r6mx1WEZGzJvXZVqr17vYQ9yLhmjuSz",
      nativeSegwit: "dgb1q6c5jzgduyje29w9lsdwkd52dn3qxpcch87urdm",
    },
  },
  {
    id: "litecoin",
    feePerByte: 39,
    recipients: {
      legacy: "LLVLXPBzLTHYjF5Q4r6iCEEztCmWecazwP",
      segwit: "MGWgRF4qLAHtYhEe6VcQNeQRxVhPd3evHc",
      nativeSegwit: "ltc1qd2x2x0wf3wgkka87qlm8772tuw6yx6fl9j07ag",
    },
  },
];

const MINIMUM_SPENDABLE_AMOUNT = 1_000;
const MINIMUM_FUNDED_BALANCE = 5_000;

const { accountBridge } = bridge;

const SYNC_CONFIG = { paginationConfig: {}, blacklistedTokenIds: [] };

const richestAccount = (accounts: BitcoinAccount[]): BitcoinAccount => {
  return accounts.reduce((richest, account) =>
    account.spendableBalance.gt(richest.spendableBalance) ? account : richest,
  );
};

describe.each(CURRENCIES)(
  "bitcoin family account bridge on $id (integration)",
  ({ id, feePerByte, recipients }) => {
    let account: BitcoinAccount;
    let sendAmount: BigNumber;

    const transactionTo = async (
      recipient: string,
      patch: Partial<Transaction> = {},
    ): Promise<Transaction> => {
      return accountBridge.prepareTransaction(account, {
        ...accountBridge.createTransaction(account),
        recipient,
        amount: sendAmount,
        feePerByte: new BigNumber(feePerByte),
        feesStrategy: "custom",
        ...patch,
      });
    };

    beforeAll(async () => {
      const scanned = await scanWithRecordedDevice(id);
      const funded = scanned
        .filter(isBitcoinAccount)
        .filter(scannedAccount => scannedAccount.spendableBalance.gt(MINIMUM_FUNDED_BALANCE));
      account = richestAccount(funded);
      sendAmount = BigNumber.max(
        MINIMUM_SPENDABLE_AMOUNT,
        account.spendableBalance.div(10),
      ).integerValue();
    }, 360_000);

    it("scans at least one funded account", () => {
      expect(account.spendableBalance.gt(MINIMUM_FUNDED_BALANCE)).toEqual(true);
    });

    it("accepts a legacy, a segwit and a native segwit recipient", async () => {
      const statuses = await Promise.all(
        Object.values(recipients).map(async recipient =>
          accountBridge.getTransactionStatus(account, await transactionTo(recipient)),
        ),
      );

      expect(
        statuses.map(status => ({
          errors: status.errors,
          amount: status.amount.toString(),
        })),
      ).toEqual(
        Object.values(recipients).map(() => ({
          errors: {},
          amount: sendAmount.toString(),
        })),
      );
    });

    it("spends the amount and the fees from the inputs", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo(recipients.nativeSegwit),
      );

      expect({
        feesAreSet: status.estimatedFees.gt(0),
        totalSpentCoversAmountAndFees: status.totalSpent.gte(
          status.amount.plus(status.estimatedFees),
        ),
        spentWithinBalance: status.totalSpent.lte(account.spendableBalance),
      }).toEqual({
        feesAreSet: true,
        totalSpentCoversAmountAndFees: true,
        spentWithinBalance: true,
      });
    });

    it("sends the spendable balance minus the fees when sending the maximum", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo(recipients.nativeSegwit, {
          useAllAmount: true,
          amount: new BigNumber(0),
        }),
      );

      expect({
        errors: status.errors,
        amount: status.amount.toString(),
      }).toEqual({
        errors: {},
        amount: account.spendableBalance.minus(status.estimatedFees).toString(),
      });
    });

    it("estimates the maximum spendable amount as the amount of a send maximum", async () => {
      const transaction = await transactionTo(recipients.nativeSegwit, {
        useAllAmount: true,
        amount: new BigNumber(0),
      });
      const status = await accountBridge.getTransactionStatus(account, transaction);

      const max = await accountBridge.estimateMaxSpendable({ account, transaction });

      expect(max.toString()).toEqual(status.amount.toString());
    });

    it("estimates a maximum spendable amount between zero and the balance", async () => {
      const max = await accountBridge.estimateMaxSpendable({ account });

      expect({
        positive: max.gte(0),
        withinBalance: max.lte(account.balance),
      }).toEqual({ positive: true, withinBalance: true });
    });

    it("requires a recipient", async () => {
      const status = await accountBridge.getTransactionStatus(account, await transactionTo(""));

      expect(status.errors.recipient?.name).toEqual("RecipientRequired");
    });

    it("rejects a recipient that is not an address", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo("invalidADDRESS"),
      );

      expect(status.errors.recipient?.name).toEqual("InvalidAddress");
    });

    it("requires an amount", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo(recipients.nativeSegwit, { amount: new BigNumber(0) }),
      );

      expect(status.errors.amount?.name).toEqual("AmountRequired");
    });

    it("rejects an amount below the dust limit", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo(recipients.nativeSegwit, { amount: new BigNumber(1) }),
      );

      expect(status.errors.dustLimit?.name).toEqual("DustLimit");
    });

    it("reports a lack of balance when the amount exceeds the balance", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo(recipients.nativeSegwit, {
          amount: account.spendableBalance.plus(MINIMUM_SPENDABLE_AMOUNT),
        }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("reports a lack of balance when every utxo is excluded", async () => {
      const status = await accountBridge.getTransactionStatus(
        account,
        await transactionTo(recipients.nativeSegwit, {
          utxoStrategy: {
            strategy: 0,
            excludeUTXOs: (account.bitcoinResources?.utxos ?? []).map(({ hash, outputIndex }) => ({
              hash,
              outputIndex,
            })),
          },
        }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("restores the account after a serialization round trip", async () => {
      const restored = await restoreBitcoinAccount(account);

      expect({
        id: restored.id,
        freshAddress: restored.freshAddress,
        freshAddressPath: restored.freshAddressPath,
        balance: restored.balance.toString(),
        operationsCount: restored.operationsCount,
        operationIds: restored.operations.map(operation => operation.id),
      }).toEqual({
        id: account.id,
        freshAddress: account.freshAddress,
        freshAddressPath: account.freshAddressPath,
        balance: account.balance.toString(),
        operationsCount: account.operationsCount,
        operationIds: account.operations.map(operation => operation.id),
      });
    });

    it("keeps the utxos of the account after a serialization round trip", async () => {
      const restored = await restoreBitcoinAccount(account);

      expect(restored).toMatchObject({
        bitcoinResources: { utxos: account.bitcoinResources?.utxos },
      });
    });

    it("synchronizes a restored account without losing operations", async () => {
      const restored = await restoreBitcoinAccount(account);

      const update = await lastValueFrom(accountBridge.sync(restored, SYNC_CONFIG));
      const synced = update(restored);

      expect({
        id: synced.id,
        knownOperationsKept: synced.operations.map(operation => operation.id),
        balanceIsSumOfOperations: synced.balance.toString(),
      }).toEqual({
        id: account.id,
        knownOperationsKept: expect.arrayContaining(
          account.operations.map(operation => operation.id),
        ),
        balanceIsSumOfOperations: synced.operations
          .reduce(
            (sum, operation) => sum.plus(getOperationAmountNumber(operation)),
            new BigNumber(0),
          )
          .toString(),
      });
    });

    it("reports the errors of an empty transaction with zero amounts", async () => {
      const status = await accountBridge.getTransactionStatus(account, {
        ...accountBridge.createTransaction(account),
        feePerByte: new BigNumber(0.0001),
      });

      expect({
        recipientError: status.errors.recipient?.name,
        amount: status.amount,
        estimatedFees: status.estimatedFees,
        totalSpent: status.totalSpent,
      }).toEqual({
        recipientError: "RecipientRequired",
        amount: new BigNumber(0),
        estimatedFees: new BigNumber(0),
        totalSpent: new BigNumber(0),
      });
    });

    it("prepares a transaction to a stable result", async () => {
      const prepared = await transactionTo(recipients.nativeSegwit);

      const preparedAgain = await accountBridge.prepareTransaction(account, prepared);

      expect(preparedAgain).toEqual(prepared);
    });

    it("prepares the same transaction identically when run in parallel", async () => {
      const prepared = await transactionTo(recipients.nativeSegwit);
      const first = await accountBridge.prepareTransaction(account, prepared);

      const concurrent = await Promise.all(
        [1, 2, 3].map(() => accountBridge.prepareTransaction(account, prepared)),
      );

      expect(concurrent).toEqual([first, first, first]);
    });

    it("recovers the scanned account from its xpub only", async () => {
      const recovered = await restoreFromXpubOnly(account);

      const update = await lastValueFrom(accountBridge.sync(recovered, SYNC_CONFIG));
      const synced = update(recovered);

      expect({
        id: synced.id,
        freshAddress: synced.freshAddress,
        freshAddressPath: synced.freshAddressPath,
        balance: synced.balance.toString(),
        operationIds: synced.operations.map(operation => operation.id),
      }).toEqual({
        id: account.id,
        freshAddress: account.freshAddress,
        freshAddressPath: account.freshAddressPath,
        balance: account.balance.toString(),
        operationIds: account.operations.map(operation => operation.id),
      });
    });

    it("keeps the references of the known operations when synchronizing again", async () => {
      const restored = await restoreBitcoinAccount(account);
      const known = restored.operations.slice(Math.floor(restored.operations.length / 2));

      const update = await lastValueFrom(
        accountBridge.sync({ ...restored, operations: known, blockHeight: 0 }, SYNC_CONFIG),
      );
      const synced = update({ ...restored, operations: known, blockHeight: 0 });

      expect({
        count: synced.operations.length,
        sameReferences: synced.operations
          .slice(restored.operations.length - known.length)
          .map((operation, i) => operation === known[i]),
      }).toEqual({
        count: restored.operations.length,
        sameReferences: known.map(() => true),
      });
    });

    it("cleans up the pending operations when synchronizing", async () => {
      const restored = await restoreBitcoinAccount(account);
      const withPending: BitcoinAccount = {
        ...restored,
        operations: restored.operations.slice(1),
        pendingOperations: restored.operations.slice(0, 1),
        blockHeight: 0,
      };

      const update = await lastValueFrom(accountBridge.sync(withPending, SYNC_CONFIG));
      const synced = update(withPending);

      expect({
        operationIds: synced.operations.map(operation => operation.id),
        pendingOperations: synced.pendingOperations,
      }).toEqual({
        operationIds: restored.operations.map(operation => operation.id),
        pendingOperations: [],
      });
    });

    it("loads the network fees when the fees strategy is not custom", async () => {
      const prepared = await accountBridge.prepareTransaction(account, {
        ...accountBridge.createTransaction(account),
        recipient: recipients.nativeSegwit,
        amount: sendAmount,
        feesStrategy: "medium",
      });

      expect({
        feeLoaded: prepared.feePerByte?.gt(0),
        networkInfoLoaded: prepared.networkInfo?.feeItems.items.length,
      }).toEqual({ feeLoaded: true, networkInfoLoaded: 3 });
    });
  },
);

describe("bitcoin account bridge OP_RETURN (integration)", () => {
  let account: BitcoinAccount;

  const transactionWithData = async (data: Buffer): Promise<Transaction> => {
    return accountBridge.prepareTransaction(account, {
      ...accountBridge.createTransaction(account),
      recipient: CURRENCIES[0].recipients.nativeSegwit,
      amount: new BigNumber(MINIMUM_SPENDABLE_AMOUNT),
      feePerByte: new BigNumber(1),
      feesStrategy: "custom",
      opReturnData: data,
    });
  };

  beforeAll(async () => {
    const scanned = await scanWithRecordedDevice("bitcoin");
    account = richestAccount(
      scanned
        .filter(isBitcoinAccount)
        .filter(scannedAccount => scannedAccount.spendableBalance.gt(MINIMUM_FUNDED_BALANCE)),
    );
  }, 360_000);

  it("accepts a short message", async () => {
    const status = await accountBridge.getTransactionStatus(
      account,
      await transactionWithData(Buffer.from("charley loves heidi", "utf-8")),
    );

    expect({ errors: status.errors, opReturnData: status.opReturnData }).toEqual({
      errors: {},
      opReturnData: "charley loves heidi",
    });
  });

  it("rejects a message larger than the limit", async () => {
    const status = await accountBridge.getTransactionStatus(
      account,
      await transactionWithData(
        Buffer.from(
          "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        ),
      ),
    );

    expect(status.errors.opReturnSizeLimit?.name).toEqual("OpReturnDataSizeLimit");
  });
});
