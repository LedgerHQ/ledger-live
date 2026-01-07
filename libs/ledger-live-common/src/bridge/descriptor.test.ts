import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import {
  getDescriptor,
  getSendDescriptor,
  sendFeatures,
  applyMemoToTransaction,
} from "./descriptor";
import * as configModule from "../config/index";

jest.mock("../config/index");

describe("getDescriptor", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should return null for undefined currency", () => {
    const descriptor = getDescriptor(undefined);
    expect(descriptor).toBeNull();
  });

  it.each([
    [
      "bitcoin",
      {
        send: {
          inputs: {},
          fees: {
            hasPresets: true,
            hasCustom: true,
            hasCoinControl: true,
          },
          selfTransfer: "free",
        },
      },
    ],
    [
      "ethereum",
      {
        send: {
          inputs: {
            recipientSupportsDomain: true,
          },
          fees: {
            hasPresets: true,
            hasCustom: true,
          },
          selfTransfer: "free",
          errors: {
            userRefusedTransaction: "UserRefusedOnDevice",
          },
        },
      },
    ],
    [
      "solana",
      {
        send: {
          inputs: {
            memo: {
              type: "text",
              maxLength: 32,
            },
          },
          fees: {
            hasPresets: true,
            hasCustom: false,
          },
        },
      },
    ],
  ])("should return descriptor for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const descriptor = getDescriptor(currency);
    expect(descriptor).toEqual(expected);
  });

  it.each([
    [
      "feature is inactive",
      {
        status: {
          type: "active",
          features: [{ id: "blockchain_txs", status: "inactive" }],
        },
      } as CurrencyConfig,
    ],
    [
      "currency status is not active",
      {
        status: {
          type: "under_maintenance",
          message: "Maintenance",
        },
      } as CurrencyConfig,
    ],
  ]);
});

describe("getSendDescriptor", () => {
  it("should return send descriptor", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const sendDescriptor = getSendDescriptor(bitcoin);
    expect(sendDescriptor).toEqual({
      inputs: {},
      fees: {
        hasPresets: true,
        hasCustom: true,
        hasCoinControl: true,
      },
      selfTransfer: "free",
    });
  });
});

describe("sendFeatures", () => {
  beforeEach(() => {
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });
  });

  it.each([
    ["solana", true],
    ["bitcoin", false],
  ])("should check memo support for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    expect(sendFeatures.hasMemo(currency)).toBe(expected);
  });

  it("should check fee presets support", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.hasFeePresets(bitcoin)).toBe(true);
  });

  it("should check custom fees support", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.hasCustomFees(bitcoin)).toBe(true);
  });

  it("should check coin control support", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.hasCoinControl(bitcoin)).toBe(true);
  });

  it("should get memo type", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getMemoType(solana)).toBe("text");
  });

  it("should get memo max length", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getMemoMaxLength(solana)).toBe(32);
  });

  it("should get memo default option", () => {
    const stellar = getCryptoCurrencyById("stellar");
    expect(sendFeatures.getMemoDefaultOption(stellar)).toBe("MEMO_ID");
  });

  it("should return undefined when memo has no default option", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getMemoDefaultOption(solana)).toBeUndefined();
  });

  it.each([
    ["ethereum", true],
    ["bitcoin", false],
  ])("should check domain support for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    expect(sendFeatures.supportsDomain(currency)).toBe(expected);
  });

  describe("applyMemoToTransaction", () => {
    describe("fallback behavior", () => {
      it.each(["algorand", "cosmos", "hedera", "stacks", "internet_computer", "mina"])(
        "should use default memo field for %s",
        family => {
          const result = applyMemoToTransaction(family, "test memo");
          expect(result).toEqual({ memo: "test memo" });
        },
      );

      it("should handle undefined memo with fallback", () => {
        const result = applyMemoToTransaction("unknown_chain", undefined);
        expect(result).toEqual({ memo: undefined });
      });
    });

    describe("nested structures", () => {
      it("should apply memo for solana with empty transaction", () => {
        const result = applyMemoToTransaction("solana", "test memo", {});
        expect(result).toEqual({
          model: {
            uiState: {
              memo: "test memo",
            },
          },
        });
      });

      it("should apply memo for solana preserving existing data", () => {
        const transaction = {
          model: {
            kind: "transfer",
            uiState: {
              amount: "100",
            },
          },
        };
        const result = applyMemoToTransaction("solana", "test memo", transaction);
        expect(result).toEqual({
          model: {
            kind: "transfer",
            uiState: {
              amount: "100",
              memo: "test memo",
            },
          },
        });
      });

      it("should apply memo for ton with empty transaction", () => {
        const result = applyMemoToTransaction("ton", "test comment", {});
        expect(result).toEqual({
          comment: {
            text: "test comment",
          },
        });
      });

      it("should apply memo for ton preserving existing data", () => {
        const transaction = {
          comment: {
            isEncrypted: false,
          },
        };
        const result = applyMemoToTransaction("ton", "test comment", transaction);
        expect(result).toEqual({
          comment: {
            isEncrypted: false,
            text: "test comment",
          },
        });
      });
    });

    describe("special field names", () => {
      it("should apply transferId for casper", () => {
        const result = applyMemoToTransaction("casper", "12345");
        expect(result).toEqual({ transferId: "12345" });
      });

      it("should apply numeric tag for xrp", () => {
        const result = applyMemoToTransaction("xrp", 12345);
        expect(result).toEqual({ tag: 12345 });
      });

      it("should convert string to number for xrp", () => {
        const result = applyMemoToTransaction("xrp", "67890");
        expect(result).toEqual({ tag: 67890 });
      });

      it("should handle undefined tag for xrp", () => {
        const result = applyMemoToTransaction("xrp", undefined);
        expect(result).toEqual({ tag: undefined });
      });

      it("should apply memoValue for stellar", () => {
        const result = applyMemoToTransaction("stellar", "stellar memo");
        expect(result).toEqual({ memoValue: "stellar memo" });
      });
    });
  });

  it.each([
    ["bitcoin", "free"],
    ["ethereum", "free"],
    ["filecoin", "free"],
    ["cardano", "free"],
    ["solana", "impossible"],
    ["cosmos", "impossible"],
    ["near", "warning"],
    ["vechain", "warning"],
  ])("should get self transfer policy for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    expect(sendFeatures.getSelfTransferPolicy(currency)).toBe(expected);
  });

  it("should return impossible as default self transfer policy", () => {
    expect(sendFeatures.getSelfTransferPolicy(undefined)).toBe("impossible");
  });

  it.each([
    ["stellar", "StellarUserRefusedError"],
    ["ethereum", "UserRefusedOnDevice"],
    ["cosmos", "UserRefusedOnDevice"],
    ["bitcoin", "TransactionRefusedOnDevice"],
    ["solana", "TransactionRefusedOnDevice"],
    ["tron", "TransactionRefusedOnDevice"],
    ["cardano", "TransactionRefusedOnDevice"],
    ["filecoin", "TransactionRefusedOnDevice"],
  ])("should get user refused transaction error name for %s", (currencyId, expected) => {
    const currency = getCryptoCurrencyById(currencyId);
    expect(sendFeatures.getUserRefusedTransactionErrorName(currency)).toBe(expected);
  });

  it("should return TransactionRefusedOnDevice as default when currency is undefined", () => {
    expect(sendFeatures.getUserRefusedTransactionErrorName(undefined)).toBe(
      "TransactionRefusedOnDevice",
    );
  });

  it.each([
    ["stellar", { name: "StellarUserRefusedError" }, true],
    ["ethereum", { name: "UserRefusedOnDevice" }, true],
    ["cosmos", { name: "UserRefusedOnDevice" }, true],
    ["bitcoin", { name: "TransactionRefusedOnDevice" }, true],
    ["solana", { name: "TransactionRefusedOnDevice" }, true],
    ["tron", { name: "TransactionRefusedOnDevice" }, true],
    ["bitcoin", { name: "UserRefusedOnDevice" }, false],
    ["ethereum", { name: "TransactionRefusedOnDevice" }, false],
    ["bitcoin", null, false],
    ["bitcoin", undefined, false],
    ["bitcoin", {}, false],
  ])(
    "should check if error is user refused transaction error for %s",
    (currencyId, error, expected) => {
      const currency = getCryptoCurrencyById(currencyId);
      expect(sendFeatures.isUserRefusedTransactionError(currency, error)).toBe(expected);
    },
  );

  it("should return false when currency is undefined", () => {
    expect(
      sendFeatures.isUserRefusedTransactionError(undefined, { name: "TransactionRefusedOnDevice" }),
    ).toBe(false);
  });
});
