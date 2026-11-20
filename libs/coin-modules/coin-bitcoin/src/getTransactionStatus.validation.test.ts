import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { NotEnoughBalance } from "@ledgerhq/ledger-wallet-framework/errors";
import { OP_RETURN_DATA_SIZE_LIMIT } from "@ledgerhq/wallet-btc/crypto/base";
import { TEST_CONFIG, TEST_LOGGER } from "./__tests__/fixtures/coinConfig";
import { createFixtureAccount } from "./fixtures/common.fixtures";
import { createTransaction } from "./createTransaction";
import type { BitcoinAccount, BitcoinInput, BitcoinOutput, Transaction } from "./types";

jest.mock("./cache", () => ({
  ...jest.requireActual("./cache"),
  calculateFees: jest.fn(),
}));

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => ({
  ...jest.requireActual("@ledgerhq/ledger-wallet-framework/sanction/index"),
  isAddressSanctioned: jest.fn().mockResolvedValue(false),
}));

import * as cache from "./cache";
import getTransactionStatus from "./getTransactionStatus";

const calculateFeesSpy = jest.mocked(cache.calculateFees);

const SENDER_ADDRESS = "1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M";
const CHANGE_ADDRESS = "17gPmBH8b6UkvSmxMfVjuLNAqzgAroiPSe";
const BITCOIN_RECIPIENT = "BC1QQMXQDRKXGX6SWRVJL9L2E6SZVVKG45ALL5U4FL";
const SEND_AMOUNT = 10_000_000;

const input = (value: number): BitcoinInput => ({
  address: SENDER_ADDRESS,
  value: new BigNumber(value),
  previousTxHash: "00".repeat(32),
  previousOutputIndex: 0,
});

const changeOutput = (value: number): BitcoinOutput => ({
  hash: "00".repeat(32),
  outputIndex: 1,
  blockHeight: null,
  address: CHANGE_ADDRESS,
  value: new BigNumber(value),
  rbf: false,
  isChange: true,
});

const accountOf = (currencyId: string): BitcoinAccount => ({
  ...createFixtureAccount(),
  currency: getCryptoCurrencyById(currencyId),
});

const transactionTo = (
  account: BitcoinAccount,
  recipient: string,
  patch: Partial<Transaction> = {},
): Transaction => ({
  ...createTransaction(account),
  recipient,
  amount: new BigNumber(SEND_AMOUNT),
  feePerByte: new BigNumber(1),
  ...patch,
});

const feesOf = (fees: number, inputs = [input(100_000)], outputs: BitcoinOutput[] = []) => ({
  txInputs: inputs,
  txOutputs: outputs,
  fees: new BigNumber(fees),
});

const statusOf = (account: BitcoinAccount, transaction: Transaction) =>
  getTransactionStatus(TEST_CONFIG, TEST_LOGGER, account, transaction);

describe("getTransactionStatus validation on the bitcoin family", () => {
  const bitcoin = accountOf("bitcoin");

  beforeEach(() => {
    calculateFeesSpy.mockReset();
    calculateFeesSpy.mockResolvedValue(feesOf(250));
  });

  describe("recipient", () => {
    it("requires a recipient when it is empty", async () => {
      const status = await statusOf(bitcoin, transactionTo(bitcoin, ""));

      expect(status.errors.recipient?.name).toEqual("RecipientRequired");
    });

    it("does not estimate the fees when the recipient is empty", async () => {
      await statusOf(bitcoin, transactionTo(bitcoin, ""));

      expect(calculateFeesSpy).not.toHaveBeenCalled();
    });

    it("rejects a recipient that is not an address", async () => {
      const status = await statusOf(bitcoin, transactionTo(bitcoin, "invalidADDRESS"));

      expect(status.errors.recipient?.name).toEqual("InvalidAddress");
    });

    it("rejects a litecoin address on bitcoin", async () => {
      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, "LLVLXPBzLTHYjF5Q4r6iCEEztCmWecazwP"),
      );

      expect(status.errors.recipient?.name).toEqual("InvalidAddress");
    });

    it.each([
      ["bitcoin", "legacy", "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e"],
      ["bitcoin", "segwit", "34N7XoKANmM66ZQDyQf2j8hPaTo6v5X8eA"],
      ["bitcoin", "native segwit", BITCOIN_RECIPIENT],
      ["digibyte", "legacy", "DMtVdcKhnbntP1dSYYmSFNg8GK1T8aCwCb"],
      ["digibyte", "segwit", "Sb4r6mx1WEZGzJvXZVqr17vYQ9yLhmjuSz"],
      ["digibyte", "native segwit", "dgb1q6c5jzgduyje29w9lsdwkd52dn3qxpcch87urdm"],
      ["litecoin", "legacy", "LLVLXPBzLTHYjF5Q4r6iCEEztCmWecazwP"],
      ["litecoin", "segwit", "MGWgRF4qLAHtYhEe6VcQNeQRxVhPd3evHc"],
      ["litecoin", "native segwit", "ltc1qd2x2x0wf3wgkka87qlm8772tuw6yx6fl9j07ag"],
    ])("accepts a %s %s recipient", async (currencyId, _format, recipient) => {
      const account = accountOf(currencyId);

      const status = await statusOf(account, transactionTo(account, recipient));

      expect({ errors: status.errors, warnings: status.warnings, amount: status.amount }).toEqual({
        errors: {},
        warnings: {},
        amount: new BigNumber(SEND_AMOUNT),
      });
    });
  });

  describe("amount", () => {
    it("requires an amount when it is zero", async () => {
      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { amount: new BigNumber(0) }),
      );

      expect(status.errors.amount?.name).toEqual("AmountRequired");
    });

    it("reports a lack of balance when the fee estimation fails with NotEnoughBalance", async () => {
      calculateFeesSpy.mockRejectedValue(new NotEnoughBalance());

      const status = await statusOf(bitcoin, transactionTo(bitcoin, BITCOIN_RECIPIENT));

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("reports a lack of balance when sending the maximum with nothing to spend", async () => {
      calculateFeesSpy.mockResolvedValue(feesOf(0, [], []));

      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { useAllAmount: true, amount: new BigNumber(0) }),
      );

      expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
    });

    it("reports a dust limit for an amount of one satoshi", async () => {
      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { amount: new BigNumber(1) }),
      );

      expect(status.errors.dustLimit?.name).toEqual("DustLimit");
    });
  });

  describe("send max", () => {
    it("sends the spent inputs minus the fees", async () => {
      calculateFeesSpy.mockResolvedValue(feesOf(250, [input(60_000), input(40_000)]));

      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { useAllAmount: true, amount: new BigNumber(0) }),
      );

      expect({
        amount: status.amount,
        estimatedFees: status.estimatedFees,
        totalSpent: status.totalSpent,
        errors: status.errors,
      }).toEqual({
        amount: new BigNumber(99_750),
        estimatedFees: new BigNumber(250),
        totalSpent: new BigNumber(100_000),
        errors: {},
      });
    });

    it("leaves the change out of the spent amount", async () => {
      calculateFeesSpy.mockResolvedValue(feesOf(250, [input(100_000)], [changeOutput(5_000)]));

      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { useAllAmount: true, amount: new BigNumber(0) }),
      );

      expect({ amount: status.amount, totalSpent: status.totalSpent }).toEqual({
        amount: new BigNumber(94_750),
        totalSpent: new BigNumber(95_000),
      });
    });
  });

  describe("fees", () => {
    it("reports the estimated fees and the inputs of a regular send", async () => {
      calculateFeesSpy.mockResolvedValue(
        feesOf(250, [input(20_000_000)], [changeOutput(9_999_750)]),
      );

      const status = await statusOf(bitcoin, transactionTo(bitcoin, BITCOIN_RECIPIENT));

      expect({
        amount: status.amount,
        estimatedFees: status.estimatedFees,
        totalSpent: status.totalSpent,
        txInputs: status.txInputs,
      }).toEqual({
        amount: new BigNumber(SEND_AMOUNT),
        estimatedFees: new BigNumber(250),
        totalSpent: new BigNumber(10_000_250),
        txInputs: [input(20_000_000)],
      });
    });

    it("warns that the fees are too high when they exceed a tenth of the amount", async () => {
      calculateFeesSpy.mockResolvedValue(feesOf(1_001));

      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { amount: new BigNumber(10_000) }),
      );

      expect(status.warnings.feeTooHigh?.name).toEqual("FeeTooHigh");
    });

    it("does not warn when the fees are exactly a tenth of the amount", async () => {
      calculateFeesSpy.mockResolvedValue(feesOf(1_000));

      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, { amount: new BigNumber(10_000) }),
      );

      expect(status.warnings).toEqual({});
    });
  });

  describe("OP_RETURN", () => {
    it("accepts data of the maximum size", async () => {
      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, {
          opReturnData: Buffer.alloc(OP_RETURN_DATA_SIZE_LIMIT, "a"),
        }),
      );

      expect(status.errors).toEqual({});
    });

    it("exposes the data of a send with OP_RETURN", async () => {
      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, {
          opReturnData: Buffer.from("charley loves heidi", "utf-8"),
        }),
      );

      expect({ errors: status.errors, opReturnData: status.opReturnData }).toEqual({
        errors: {},
        opReturnData: "charley loves heidi",
      });
    });

    it("rejects data larger than the maximum size", async () => {
      const status = await statusOf(
        bitcoin,
        transactionTo(bitcoin, BITCOIN_RECIPIENT, {
          opReturnData: Buffer.alloc(OP_RETURN_DATA_SIZE_LIMIT + 1, "a"),
        }),
      );

      expect(status.errors.opReturnSizeLimit?.name).toEqual("OpReturnDataSizeLimit");
    });
  });
});
