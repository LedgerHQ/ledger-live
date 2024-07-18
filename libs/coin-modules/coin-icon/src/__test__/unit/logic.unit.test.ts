import { BigNumber } from "bignumber.js";
import IconService from "icon-sdk-js";
import {
  convertLoopToIcx,
  convertICXtoLoop,
  EXISTENTIAL_DEPOSIT,
  MAX_AMOUNT_INPUT,
  isValidAddress,
  isSelfTransaction,
  getNonce,
  isTestnet,
  getNid,
  calculateAmount,
  getMinimumBalance,
} from "../../logic";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { IconAccount, Transaction } from "../../types";
import { BERLIN_TESTNET_NID, MAINNET_NID } from "../../constants";

jest.mock("@ledgerhq/cryptoassets", () => ({
  getCryptoCurrencyById: jest.fn(),
}));

const { IconAmount } = IconService;

describe("Icon Utils", () => {
  describe("Conversion functions", () => {
    it("should convert loop to ICX correctly", () => {
      const value = "1000000000000000000";
      const result = convertLoopToIcx(value);
      expect(
        result.isEqualTo(new BigNumber(IconAmount.fromLoop(value, IconAmount.Unit.ICX.toString()))),
      ).toBe(true);
    });

    it("should convert ICX to loop correctly", () => {
      const value = "1";
      const result = convertICXtoLoop(value);
      expect(
        result.isEqualTo(new BigNumber(IconAmount.toLoop(value, IconAmount.Unit.ICX.toString()))),
      ).toBe(true);
    });
  });

  describe("Validation functions", () => {
    it("should validate address correctly", () => {
      const validAddress = "hx1234567890123456789012345678901234567890";
      const invalidAddress = "hx12345";
      expect(isValidAddress(validAddress)).toBe(true);
      expect(isValidAddress(invalidAddress)).toBe(false);
    });
  });

  describe("Transaction-related functions", () => {
    it("should identify self transaction correctly", () => {
      const account = { freshAddress: "hx1234567890123456789012345678901234567890" } as Account;
      const transaction = {
        recipient: "hx1234567890123456789012345678901234567890",
      } as Transaction;
      expect(isSelfTransaction(account, transaction)).toBe(true);
    });

    it("should get nonce correctly", () => {
      const account: IconAccount = {
        iconResources: { nonce: 5 },
        pendingOperations: [{ transactionSequenceNumber: 4 }],
      } as IconAccount;
      expect(getNonce(account)).toBe(5);

      account.pendingOperations = [{ transactionSequenceNumber: 6 }] as any;
      expect(getNonce(account)).toBe(7);
    });
  });

  describe("Network-related functions", () => {
    it("should identify testnet correctly", () => {
      (getCryptoCurrencyById as jest.Mock).mockReturnValue({ isTestnetFor: true });
      const currency = { id: "icon" } as CryptoCurrency;
      expect(isTestnet(currency)).toBe(true);
    });

    it("should return correct network ID", () => {
      (getCryptoCurrencyById as jest.Mock).mockReturnValue({ isTestnetFor: true });
      const currency = { id: "icon" } as CryptoCurrency;
      expect(getNid(currency)).toBe(BERLIN_TESTNET_NID);

      (getCryptoCurrencyById as jest.Mock).mockReturnValue({ isTestnetFor: false });
      expect(getNid(currency)).toBe(MAINNET_NID);
    });
  });

  describe("Amount calculation functions", () => {
    it("should calculate correct amount if useAllAmount is true and mode is send", () => {
      const account = {
        spendableBalance: new BigNumber(1000),
      } as IconAccount;
      const transaction = {
        useAllAmount: true,
        mode: "send",
        fees: new BigNumber(10),
      } as Transaction;

      const result = calculateAmount({ account, transaction });
      expect(result.isEqualTo(new BigNumber(990))).toBe(true);
    });

    it("should calculate correct amount if useAllAmount is true and mode is not send", () => {
      const account = {
        spendableBalance: new BigNumber(1000),
      } as IconAccount;
      const transaction = {
        useAllAmount: true,
        mode: "other",
        fees: new BigNumber(10),
      } as Transaction;

      const result = calculateAmount({ account, transaction });
      expect(result.isEqualTo(new BigNumber(990))).toBe(true);
    });

    it("should limit amount to MAX_AMOUNT_INPUT", () => {
      const account = {} as IconAccount;
      const transaction = {
        useAllAmount: false,
        amount: new BigNumber(10000000000000000000000000000000000),
      } as Transaction;

      const result = calculateAmount({ account, transaction });
      expect(result.isEqualTo(new BigNumber(MAX_AMOUNT_INPUT))).toBe(true);
    });

    it("should calculate minimum balance correctly", () => {
      const account = {
        balance: new BigNumber(1000),
        spendableBalance: new BigNumber(900),
      } as Account;

      const result = getMinimumBalance(account);
      expect(result.isEqualTo(EXISTENTIAL_DEPOSIT.minus(new BigNumber(100)))).toBe(true);
    });
  });
});
