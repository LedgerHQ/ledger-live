import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import {
  getMockedTransaction,
  getMockedTransactionRaw,
} from "../__tests__/fixtures/transaction.fixture";
import { formatTransaction, fromTransactionRaw, toTransactionRaw } from "./transaction";

describe("transaction", () => {
  const mockedAccount = getMockedAccount();
  const mockedTransaction = getMockedTransaction({
    amount: new BigNumber(10 ** 6), // 1 ALEO
    fees: new BigNumber(5000),
  });
  const mockedTransactionRaw = getMockedTransactionRaw({
    amount: mockedTransaction.amount.toString(),
    fees: mockedTransaction.fees.toString(),
  });
  const fullPrivateProperties = {
    amountRecordCommitments: ["abc123"],
    feeRecordCommitment: "def456",
  };
  const emptyPrivateProperties = {
    amountRecordCommitments: [],
    feeRecordCommitment: null,
  };
  const privateModesWithProperties = [
    TRANSACTION_TYPE.TRANSFER_PRIVATE,
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
    TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE,
    TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC,
  ] as const;
  const publicModesWithoutProperties = [
    TRANSACTION_TYPE.TRANSFER_PUBLIC,
    TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
    TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC,
    TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE,
  ] as const;

  it("should format transaction as a human-readable send summary", () => {
    const result = formatTransaction(mockedTransaction, mockedAccount);
    const nonBreakingSpace = String.fromCharCode(160);
    const string = `SEND 1${nonBreakingSpace}ALEO\nTO ${mockedTransaction.recipient}`;

    expect(result).toEqual(string);
  });

  it("should deserialize a raw transaction into a Transaction", () => {
    const result = fromTransactionRaw(mockedTransactionRaw);

    expect(result).toEqual(mockedTransaction);
  });

  it("should serialize a Transaction into a raw transaction", () => {
    const result = toTransactionRaw(mockedTransaction);

    expect(result).toEqual(mockedTransactionRaw);
  });

  it.each(privateModesWithProperties)(
    "should preserve properties when deserializing %s from raw",
    mode => {
      const raw = getMockedTransactionRaw({ mode, properties: fullPrivateProperties });
      const result = fromTransactionRaw(raw);

      expect(result.mode).toBe(mode);
      expect(result.properties).toEqual(fullPrivateProperties);
    },
  );

  it.each(privateModesWithProperties)(
    "should preserve null commitments when deserializing %s from raw",
    mode => {
      const raw = getMockedTransactionRaw({ mode, properties: emptyPrivateProperties });
      const result = fromTransactionRaw(raw);

      expect(result.properties).toEqual(emptyPrivateProperties);
    },
  );

  it.each(privateModesWithProperties)(
    "should preserve properties when serializing %s to raw",
    mode => {
      const transaction = getMockedTransaction({ mode, properties: fullPrivateProperties });
      const result = toTransactionRaw(transaction);

      expect(result.mode).toBe(mode);
      expect(result.properties).toEqual(fullPrivateProperties);
    },
  );

  it.each(publicModesWithoutProperties)(
    "should not include properties when deserializing %s from raw",
    mode => {
      const raw = getMockedTransactionRaw({ mode });
      const result = fromTransactionRaw(raw);

      expect("properties" in result).toBe(false);
    },
  );

  it.each(publicModesWithoutProperties)(
    "should not include properties when serializing %s to raw",
    mode => {
      const transaction = getMockedTransaction({ mode });
      const result = toTransactionRaw(transaction);

      expect("properties" in result).toBe(false);
    },
  );

  // `withdrawal` is the address unbonded funds are later released to. It is the one field a
  // bond carries beyond the common shape, so dropping it here would silently unpin the
  // withdrawal on any transaction that round-trips through storage.
  describe("bond_public", () => {
    const WITHDRAWAL = "aleo1a2ehlgqhvs3p7d4hqhs0tvgk954dr8gafu9kxse2mzu9a5sqxvpsrn98pr";

    it("should preserve the withdrawal address when deserializing from raw", () => {
      const raw = getMockedTransactionRaw({
        mode: TRANSACTION_TYPE.BOND_PUBLIC,
        withdrawal: WITHDRAWAL,
      });

      const result = fromTransactionRaw(raw);

      expect(result.mode).toBe(TRANSACTION_TYPE.BOND_PUBLIC);
      expect(result).toHaveProperty("withdrawal", WITHDRAWAL);
    });

    it("should preserve the withdrawal address when serializing to raw", () => {
      const transaction = getMockedTransaction({
        mode: TRANSACTION_TYPE.BOND_PUBLIC,
        withdrawal: WITHDRAWAL,
      });

      const result = toTransactionRaw(transaction);

      expect(result.mode).toBe(TRANSACTION_TYPE.BOND_PUBLIC);
      expect(result).toHaveProperty("withdrawal", WITHDRAWAL);
    });

    it("should not include properties", () => {
      const transaction = getMockedTransaction({
        mode: TRANSACTION_TYPE.BOND_PUBLIC,
        withdrawal: WITHDRAWAL,
      });

      expect("properties" in toTransactionRaw(transaction)).toBe(false);
    });
  });
});
