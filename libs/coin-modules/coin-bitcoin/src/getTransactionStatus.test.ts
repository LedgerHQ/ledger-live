import { Account } from "@ledgerhq/types-live";
import { InvalidAddress } from "@ledgerhq/ledger-wallet-framework/errors";
import { BitcoinInput, Transaction } from "./types";
import { AddressesSanctionedError } from "@ledgerhq/ledger-wallet-framework/sanction/errors";
import { DustLimit, RbfBuildError, FeeTooLow, ZcashSaplingRecipientNotSupported } from "./errors";
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

// Mock the UA classifier so the Zcash tests below are isolated from F4Jumble.
// Keep this alongside the other module mocks (before the module-under-test import)
// so the mock is applied deterministically regardless of the Jest/TS transform.
jest.mock("./chain-adapters/zcash/address", () => ({
  classifyZcashRecipient: jest.fn(),
}));

import * as cache from "./cache";
import * as sanction from "@ledgerhq/ledger-wallet-framework/sanction/index";
import * as zcashAddress from "./chain-adapters/zcash/address";
import getTransactionStatus, { MAX_BLOCK_HEIGHT_FOR_TAPROOT } from "./getTransactionStatus";

const calculateFeesSpy = jest.mocked(cache.calculateFees);
const validateRecipientSpy = jest.mocked(cache.validateRecipient);
const isAddressSanctionedSpy = jest.mocked(sanction.isAddressSanctioned);
const mockClassifyZcash = jest.mocked(zcashAddress.classifyZcashRecipient);

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

// ---------------------------------------------------------------------------
// Zcash shielded-context recipient validation
// ---------------------------------------------------------------------------

describe("getTransactionStatus — Zcash shielded-context recipient validation", () => {
  const zcashAccount = {
    currency: { id: "zcash", name: "Zcash" },
    blockHeight: 3_000_000,
  } as unknown as Account;

  const baseZcashTx = {
    // "sender" field present = shielded context
    sender: "public",
    transferType: "transparent",
    family: "bitcoin" as const,
    amount: BigNumber(1000),
    feePerByte: null,
    networkInfo: null,
    utxoStrategy: { strategy: 0, excludeUTXOs: [] },
    rbf: false,
    useAllAmount: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
      fees: BigNumber(1000),
    });
  });

  it("sets errors.recipient = ZcashSaplingRecipientNotSupported for a zs Sapling address", async () => {
    mockClassifyZcash.mockReturnValue({ error: "sapling-unsupported" });

    const tx = {
      ...baseZcashTx,
      recipient: "zs1saplingaddr",
    } as unknown as Transaction;
    const status = await getTransactionStatus(zcashAccount, tx);

    expect(status.errors.recipient).toBeInstanceOf(ZcashSaplingRecipientNotSupported);
  });

  it("sets errors.recipient = InvalidAddress for a Sprout / garbage address", async () => {
    mockClassifyZcash.mockReturnValue({ error: "invalid" });

    const tx = {
      ...baseZcashTx,
      recipient: "zcspurious",
    } as unknown as Transaction;
    const status = await getTransactionStatus(zcashAccount, tx);

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("clears errors.recipient for a valid Orchard UA", async () => {
    // validateRecipient may set an error (e.g. for u1 which the shared validator rejects)
    validateRecipientSpy.mockResolvedValue({
      recipientError: new Error("shared validator rejects u1 without shielded context"),
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });
    mockClassifyZcash.mockReturnValue({ recipientType: "private" });

    const tx = {
      ...baseZcashTx,
      recipient: "u1orchardaddr",
    } as unknown as Transaction;
    const status = await getTransactionStatus(zcashAccount, tx);

    // The Zcash block clears the error set by validateRecipient
    expect(status.errors.recipient).toBeUndefined();
  });

  // TODO(zcash transparent-to-shielded): once the Zcash chain adapter handles
  // "transparent-to-shielded" in its own getTransactionStatus, the default path is
  // short-circuited and the skipLegacyFeeCalculation workaround is removed — update
  // this test to assert the adapter path (fees computed via PCZT) instead.
  it("accepts a shielded recipient from a transparent sender without running the legacy fee builder", async () => {
    // Legacy validation rejects u1 (as it does without shielded context)...
    validateRecipientSpy.mockResolvedValue({
      recipientError: new Error("shared validator rejects u1 without shielded context"),
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });
    // ...but the recipient classifies as a valid shielded (Orchard) address.
    mockClassifyZcash.mockReturnValue({ recipientType: "private" });

    const tx = {
      ...baseZcashTx,
      sender: "public",
      transferType: "transparent-to-shielded",
      recipient: "u1orchardaddr",
      feePerByte: BigNumber(1),
    } as unknown as Transaction;

    const status = await getTransactionStatus(zcashAccount, tx);

    // Recipient is accepted regardless of the (transparent) sender selection...
    expect(status.errors.recipient).toBeUndefined();
    // ...and the legacy Bitcoin fee builder (which throws InvalidAddress on u1)
    // is skipped, so the status resolves cleanly instead of rejecting.
    expect(calculateFeesSpy).not.toHaveBeenCalled();
  });

  it("keeps the validateRecipient error for a transparent recipient (does not clear it)", async () => {
    // classifyZcashRecipient only checks the t1/t3 prefix + length, not the
    // Base58Check checksum, so a malformed transparent address can still be
    // classified as "public". The shared validateRecipient error must survive.
    const invalidAddressError = new InvalidAddress("", {
      currencyName: "Zcash",
    });
    validateRecipientSpy.mockResolvedValue({
      recipientError: invalidAddressError,
      recipientWarning: undefined,
      changeAddressError: undefined,
      changeAddressWarning: undefined,
    });
    mockClassifyZcash.mockReturnValue({ recipientType: "public" });

    const tx = {
      ...baseZcashTx,
      recipient: "t1malformedtransparentaddr",
    } as unknown as Transaction;
    const status = await getTransactionStatus(zcashAccount, tx);

    expect(status.errors.recipient).toBe(invalidAddressError);
  });

  it("does not apply Zcash logic when sender field is absent (flag-off)", async () => {
    const tx = {
      family: "bitcoin" as const,
      amount: BigNumber(1000),
      recipient: "zs1saplingaddr",
      feePerByte: null,
      networkInfo: null,
      utxoStrategy: { strategy: 0, excludeUTXOs: [] },
      rbf: false,
      useAllAmount: false,
    } as unknown as Transaction;
    // No "sender" field = flag-off context

    const status = await getTransactionStatus(zcashAccount, tx);

    expect(mockClassifyZcash).not.toHaveBeenCalled();
  });
});
