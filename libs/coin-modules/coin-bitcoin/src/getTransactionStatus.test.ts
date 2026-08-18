import { Account } from "@ledgerhq/types-live";
import { BitcoinInput, Transaction } from "./types";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { DustLimit, RbfBuildError, FeeTooLow } from "./errors";
import BigNumber from "bignumber.js";

// Mock modules before importing the module under test
jest.mock("./cache", () => {
  const actual = jest.requireActual("./cache");
  return {
    ...actual,
    calculateFees: jest.fn(),
    validateRecipient: jest.fn(),
  };
});

jest.mock("@ledgerhq/ledger-wallet-framework/sanction/index", () => {
  const actual = jest.requireActual("@ledgerhq/ledger-wallet-framework/sanction/index");
  return {
    ...actual,
    isAddressSanctioned: jest.fn(),
  };
});

import * as cache from "./cache";
import * as sanction from "@ledgerhq/ledger-wallet-framework/sanction/index";
import getTransactionStatus, { MAX_BLOCK_HEIGHT_FOR_TAPROOT } from "./getTransactionStatus";

const calculateFeesSpy = jest.mocked(cache.calculateFees);
const validateRecipientSpy = jest.mocked(cache.validateRecipient);
const isAddressSanctionedSpy = jest.mocked(sanction.isAddressSanctioned);

describe("getTransactionStatus on Bitcoin", () => {
  it("should return as sender error only sanctioned utxo addresses", async () => {
    validateRecipientSpy.mockResolvedValue({
      recipientError: undefined,
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });

    const sanctionedAddresses = [
      "bc1qneyw3q5r7m88e7yheem7wn4wvx2chug5g4hrve",
      "bc1qx47dkcps02ce4e9ppkse4kesx79ds3h4zsadqa",
    ];

    const utxoAddresses = [
      {
        address: "bc1qneyw3q5r7m88e7yheem7wn4wvx2chug5g4hrve",
      },
      {
        address: "bc1qx47dkcps02ce4e9ppkse4kesx79ds3h4zsadqa",
      },
      {
        address: "bc1q2nj06sukhuuuvc88g0rh7eqe3r9n3rm66a7syv",
      },
      {
        address: "bc1qa8kyt89kfh2cnf0q39pglhegj53xcwqtkf6jkd",
      },
    ] as unknown as BitcoinInput[];

    isAddressSanctionedSpy.mockImplementation((_, address: string) => {
      return Promise.resolve(sanctionedAddresses.includes(address));
    });

    calculateFeesSpy.mockResolvedValue({
      txInputs: utxoAddresses,
      txOutputs: [],
      fees: BigNumber(0),
    });

    const account = {
      currency: {
        id: "bitcoin",
      },
      blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
    } as unknown as Account;

    const transaction = {
      amount: BigNumber(1),
      recipient: "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7",
      feePerByte: BigNumber(1),
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({
      sender: new AddressesSanctionedError("AddressesSanctionedError", {
        addresses: sanctionedAddresses,
      }),
    });
  });

  it("should return no sender error when no utxo address is sanctioned", async () => {
    validateRecipientSpy.mockResolvedValue({
      recipientError: undefined,
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });

    const utxoAddresses = [
      {
        address: "bc1qneyw3q5r7m88e7yheem7wn4wvx2chug5g4hrve",
      },
      {
        address: "bc1qx47dkcps02ce4e9ppkse4kesx79ds3h4zsadqa",
      },
      {
        address: "bc1q2nj06sukhuuuvc88g0rh7eqe3r9n3rm66a7syv",
      },
      {
        address: "bc1qa8kyt89kfh2cnf0q39pglhegj53xcwqtkf6jkd",
      },
    ] as unknown as BitcoinInput[];

    isAddressSanctionedSpy.mockResolvedValue(false);
    calculateFeesSpy.mockResolvedValue({
      txInputs: utxoAddresses,
      txOutputs: [],
      fees: BigNumber(0),
    });

    const account = {
      currency: {
        id: "bitcoin",
      },
      blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
    } as unknown as Account;

    const transaction = {
      amount: BigNumber(1),
      recipient: "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7",
      feePerByte: BigNumber(1),
    } as unknown as Transaction;

    const status = await getTransactionStatus(account, transaction);
    expect(status.errors).toEqual({});
  });

  describe("RBF build failures", () => {
    const recipient = "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7";

    beforeEach(() => {
      validateRecipientSpy.mockResolvedValue({
        recipientError: undefined,
        recipientWarning: undefined,
        changeAddressError: undefined,
        changeAddressWarning: undefined,
      });
      isAddressSanctionedSpy.mockResolvedValue(false);
    });

    const buildAccount = () =>
      ({
        currency: { id: "bitcoin" },
        blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
      }) as unknown as Account;

    const buildTransaction = () =>
      ({
        amount: BigNumber(1),
        recipient,
        feePerByte: BigNumber(1),
      }) as unknown as Transaction;

    it("classifies RbfBuildError into status.errors.replacement instead of re-throwing", async () => {
      const rbfError = new RbfBuildError("Failed to build RBF transaction: needs more fees");
      calculateFeesSpy.mockRejectedValue(rbfError);

      const status = await getTransactionStatus(buildAccount(), buildTransaction());

      expect(status.errors).toEqual({ replacement: rbfError });
      expect(status.errors.replacement).toBeInstanceOf(RbfBuildError);
    });

    it("re-throws unknown errors from calculateFees", async () => {
      const unknownError = new Error("network down");
      calculateFeesSpy.mockRejectedValue(unknownError);

      await expect(getTransactionStatus(buildAccount(), buildTransaction())).rejects.toBe(
        unknownError,
      );
    });
  });

  describe("min relay fee floor", () => {
    const recipient = "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7";

    beforeEach(() => {
      validateRecipientSpy.mockResolvedValue({
        recipientError: undefined,
        recipientWarning: undefined,
        changeAddressError: undefined,
        changeAddressWarning: undefined,
      });
      isAddressSanctionedSpy.mockResolvedValue(false);
      calculateFeesSpy.mockResolvedValue({
        txInputs: [],
        txOutputs: [],
        fees: BigNumber(0),
      });
    });

    const buildAccount = () =>
      ({
        currency: { id: "bitcoin" },
        blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
      }) as unknown as Account;

    const buildTransaction = (feePerByte: number, relayFeePerByte?: number) =>
      ({
        amount: BigNumber(1),
        recipient,
        feePerByte: BigNumber(feePerByte),
        networkInfo:
          relayFeePerByte !== undefined
            ? {
                family: "bitcoin",
                feeItems: {},
                relayFeePerByte: BigNumber(relayFeePerByte),
              }
            : undefined,
      }) as unknown as Transaction;

    it("sets FeeTooLow when manual fee is below the relay floor", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction(1, 3));
      expect(status.errors.feePerByte).toBeInstanceOf(FeeTooLow);
    });

    it("accepts a manual fee equal to the relay floor", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction(3, 3));
      expect(status.errors.feePerByte).toBeUndefined();
    });

    it("applies the 1 sat/vB fallback for bitcoin when networkInfo is missing", async () => {
      const tooLow = await getTransactionStatus(buildAccount(), buildTransaction(0.5));
      expect(tooLow.errors.feePerByte).toBeInstanceOf(FeeTooLow);

      const atFloor = await getTransactionStatus(buildAccount(), buildTransaction(1));
      expect(atFloor.errors.feePerByte).toBeUndefined();
    });

    it("applies the 1 sat/vB fallback for bitcoin when relayFeePerByte is 0 (back-compat)", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction(0.5, 0));
      expect(status.errors.feePerByte).toBeInstanceOf(FeeTooLow);
    });
  });

  describe("relay-aware dust limit", () => {
    const recipient = "bc1pxlmrudqyq8qd8pfsc4mpmlaw56x6vtcr9m8nvp8kj3gckefc4kmqhkg4l7";

    beforeEach(() => {
      validateRecipientSpy.mockResolvedValue({
        recipientError: undefined,
        recipientWarning: undefined,
        changeAddressError: undefined,
        changeAddressWarning: undefined,
      });
      isAddressSanctionedSpy.mockResolvedValue(false);
      calculateFeesSpy.mockResolvedValue({
        txInputs: [],
        txOutputs: [],
        fees: BigNumber(0),
      });
    });

    // Native SegWit input = 68 vB, so relay-aware dust = 3 * 68 * relayFeePerByte
    const buildAccount = () =>
      ({
        currency: { id: "bitcoin" },
        blockHeight: MAX_BLOCK_HEIGHT_FOR_TAPROOT + 1,
        bitcoinResources: {
          walletAccount: { params: { derivationMode: "Native SegWit" } },
        },
      }) as unknown as Account;

    const buildTransaction = (amount: number, feePerByte: number, relayFeePerByte: number) =>
      ({
        amount: BigNumber(amount),
        recipient,
        feePerByte: BigNumber(feePerByte),
        networkInfo: {
          family: "bitcoin",
          feeItems: {},
          relayFeePerByte: BigNumber(relayFeePerByte),
        },
      }) as unknown as Transaction;

    it("raises DustLimit when amount is below the relay-aware dust", async () => {
      // dust = 3 * 68 * 10 = 2040 > amount 1000
      const status = await getTransactionStatus(buildAccount(), buildTransaction(1000, 10, 10));
      expect(status.errors.dustLimit).toBeInstanceOf(DustLimit);
    });

    it("does not raise DustLimit at a low relay fee for the same amount", async () => {
      // dust = 3 * 68 * 1 = 204 < amount 1000
      const status = await getTransactionStatus(buildAccount(), buildTransaction(1000, 1, 1));
      expect(status.errors.dustLimit).toBeUndefined();
    });

    it("does not compute dust (no DustLimit) when feePerByte is zero", async () => {
      const status = await getTransactionStatus(buildAccount(), buildTransaction(1000, 0, 10));
      expect(status.errors.dustLimit).toBeUndefined();
    });
  });
});
