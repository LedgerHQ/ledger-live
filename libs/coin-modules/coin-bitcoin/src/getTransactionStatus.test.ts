/* eslint @typescript-eslint/consistent-type-assertions: 0 */

import { Account } from "@ledgerhq/types-live";
import { BitcoinInput, Transaction } from "./types";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { RbfBuildError } from "./errors";
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
});
