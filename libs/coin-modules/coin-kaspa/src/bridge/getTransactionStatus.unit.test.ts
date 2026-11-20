import {
  AmountRequired,
  FeeNotLoaded,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import BigNumber from "bignumber.js";
import { DustLimit } from "../errors";
import { scanUtxos } from "../logic";
import { MAX_UTXOS_PER_TX } from "../logic/constants";
import {
  buildAccount,
  buildTransaction,
  buildUtxos,
  DUST_LIMIT,
  ECDSA_RECIPIENT,
} from "../test/fixtures";
import { ReducedAmountUtxoWarning, UtxoLimitReachedError } from "../types/errors";
import getTransactionStatus from "./getTransactionStatus";

jest.mock("../logic", () => ({
  ...jest.requireActual("../logic"),
  scanUtxos: jest.fn(),
}));

const mockScanUtxos = scanUtxos as jest.Mock;

const serveUtxos = (count: number, amount: string | number) =>
  mockScanUtxos.mockResolvedValue({ utxos: buildUtxos(count, amount), accountAddresses: {} });

describe("getTransactionStatus (legacy bridge)", () => {
  beforeEach(() => {
    mockScanUtxos.mockReset();
    serveUtxos(3, 1000000000);
  });

  describe("recipient", () => {
    it("requires a recipient", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("rejects an invalid address", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ recipient: "invalidADDRESS" }),
      );

      expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
    });
  });

  describe("amount", () => {
    it("requires an amount", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(0) }),
      );

      expect(status.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("rejects an amount below the dust limit", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ amount: new BigNumber(DUST_LIMIT - 1) }),
      );

      expect(status.errors.dustLimit).toBeInstanceOf(DustLimit);
    });

    it("reports NotEnoughBalance when the amount exceeds the spendable utxos", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "3000000000" }),
        buildTransaction({ amount: new BigNumber("5000000000") }),
      );

      expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("reports UtxoLimitReachedError when more utxos than a transaction can take hold the balance", async () => {
      serveUtxos(MAX_UTXOS_PER_TX + 1, 100000000);

      const status = await getTransactionStatus(
        buildAccount({ balance: (MAX_UTXOS_PER_TX + 1) * 100000000 }),
        buildTransaction({ amount: new BigNumber(MAX_UTXOS_PER_TX * 100000000) }),
      );

      expect(status.errors.amount).toBeInstanceOf(UtxoLimitReachedError);
    });
  });

  describe("fees", () => {
    it("requires the custom fee rate to be loaded", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ customFeeRate: undefined }),
      );

      expect(status.errors.feePerByte).toBeInstanceOf(FeeNotLoaded);
    });

    it("rejects a zero custom fee rate", async () => {
      const status = await getTransactionStatus(
        buildAccount(),
        buildTransaction({ customFeeRate: new BigNumber(0) }),
      );

      expect(status.errors.feePerByte).toBeInstanceOf(FeeRequired);
    });

    it("warns when the fees exceed a tenth of the amount", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "3000000000" }),
        buildTransaction({ customFeeRate: new BigNumber(1000) }),
      );

      expect(status.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });
  });

  describe("send", () => {
    it("reports the amount, the fees and the total spent of a valid send", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "3000000000" }),
        buildTransaction({ amount: new BigNumber(500000000) }),
      );

      expect({
        errors: status.errors,
        warnings: status.warnings,
        amount: status.amount.toString(),
        feesArePositive: status.estimatedFees.gt(0),
        totalSpentIsAmountPlusFees: status.totalSpent.eq(status.amount.plus(status.estimatedFees)),
      }).toEqual({
        errors: {},
        warnings: {},
        amount: "500000000",
        feesArePositive: true,
        totalSpentIsAmountPlusFees: true,
      });
    });

    it("charges more fees to an ECDSA recipient than to a schnorr recipient", async () => {
      const account = buildAccount({ balance: "3000000000" });
      const schnorr = await getTransactionStatus(account, buildTransaction());
      const ecdsa = await getTransactionStatus(
        account,
        buildTransaction({ recipient: ECDSA_RECIPIENT }),
      );

      expect(ecdsa.estimatedFees.gt(schnorr.estimatedFees)).toBe(true);
    });
  });

  describe("send max", () => {
    it("sets the amount to the maximum spendable amount of the utxos", async () => {
      const status = await getTransactionStatus(
        buildAccount({ balance: "3000000000" }),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect({
        errors: status.errors,
        amount: status.amount.toString(),
        totalSpent: status.totalSpent.toString(),
      }).toEqual({ errors: {}, amount: "2999996140", totalSpent: "3000000000" });
    });

    it("reports a dust limit error when the utxos are too small to send", async () => {
      serveUtxos(1, 1000000);

      const status = await getTransactionStatus(
        buildAccount({ balance: "1000000" }),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status.errors.dustLimit).toBeInstanceOf(DustLimit);
    });

    it("warns that the amount is reduced when there are more utxos than a transaction can take", async () => {
      serveUtxos(MAX_UTXOS_PER_TX + 1, 100000000);

      const status = await getTransactionStatus(
        buildAccount({ balance: (MAX_UTXOS_PER_TX + 1) * 100000000 }),
        buildTransaction({ amount: new BigNumber(0), useAllAmount: true }),
      );

      expect(status.warnings.amount).toBeInstanceOf(ReducedAmountUtxoWarning);
    });
  });
});
