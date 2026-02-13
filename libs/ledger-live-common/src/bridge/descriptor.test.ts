import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { CurrencyConfig } from "@ledgerhq/coin-framework/config";
import { BigNumber } from "bignumber.js";
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

  it("should return descriptor for bitcoin", () => {
    const currency = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const descriptor = getDescriptor(currency);
    expect(descriptor).toMatchObject({
      send: {
        inputs: {},
        fees: {
          hasPresets: true,
          hasCustom: true,
          hasCoinControl: true,
          presets: {
            legend: { type: "feeRate", unit: "sat/vbyte", valueFrom: "presetAmount" },
            strategyLabelInAmount: "legend",
          },
        },
        selfTransfer: "free",
      },
    });
    expect(typeof descriptor?.send.fees.presets?.getOptions).toBe("function");
    expect(typeof descriptor?.send.fees.presets?.shouldEstimateWithBridge).toBe("function");
  });

  it("should return descriptor for ethereum", () => {
    const currency = getCryptoCurrencyById("ethereum");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const descriptor = getDescriptor(currency);
    expect(descriptor).toMatchObject({
      send: {
        inputs: { recipientSupportsDomain: true },
        fees: {
          hasPresets: true,
          hasCustom: true,
          presets: {},
        },
        selfTransfer: "free",
        errors: { userRefusedTransaction: "UserRefusedOnDevice" },
        amount: {},
      },
    });
    expect(typeof descriptor?.send.fees.presets?.getOptions).toBe("function");
    expect(typeof descriptor?.send.amount?.getPlugins).toBe("function");
  });

  it("should return descriptor for solana", () => {
    const currency = getCryptoCurrencyById("solana");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    });

    const descriptor = getDescriptor(currency);
    expect(descriptor).toMatchObject({
      send: {
        inputs: {
          memo: {
            type: "text",
            maxLength: 32,
          },
        },
        fees: {
          hasPresets: false,
          hasCustom: false,
        },
      },
    });
  });

  const configCases: ReadonlyArray<readonly [string, CurrencyConfig]> = [
    [
      "feature is inactive",
      {
        status: {
          type: "active",
          features: [{ id: "blockchain_txs", status: "inactive" }],
        },
      },
    ],
    [
      "currency status is not active",
      {
        status: {
          type: "under_maintenance",
          message: "Maintenance",
        },
      },
    ],
  ];

  it.each(configCases)("should not be affected by config when %s", (_, mockConfig) => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue(mockConfig);

    const descriptor = getDescriptor(bitcoin);
    expect(descriptor).not.toBeNull();
  });

  it("should not be affected when no features array", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
      },
    });

    const descriptor = getDescriptor(bitcoin);
    expect(descriptor).not.toBeNull();
  });

  it("should not be affected when config throws error", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockImplementation(() => {
      throw new Error("Config not found");
    });

    const descriptor = getDescriptor(bitcoin);
    expect(descriptor).not.toBeNull();
  });
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
    expect(sendDescriptor).toMatchObject({
      inputs: {},
      fees: {
        hasPresets: true,
        hasCustom: true,
        hasCoinControl: true,
        presets: {
          legend: { type: "feeRate", unit: "sat/vbyte", valueFrom: "presetAmount" },
          strategyLabelInAmount: "legend",
        },
      },
      selfTransfer: "free",
    });
    expect(typeof sendDescriptor?.fees.presets?.getOptions).toBe("function");
    expect(typeof sendDescriptor?.fees.presets?.shouldEstimateWithBridge).toBe("function");
  });

  it("should not be affected when feature is not active", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    jest.spyOn(configModule, "getCurrencyConfiguration").mockReturnValue({
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "inactive" }],
      },
    });

    const sendDescriptor = getSendDescriptor(bitcoin);
    expect(sendDescriptor).not.toBeNull();
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

  it("should return true for canSendMax when not explicitly disabled (bitcoin, ethereum)", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    const ethereum = getCryptoCurrencyById("ethereum");
    expect(sendFeatures.canSendMax(bitcoin)).toBe(true);
    expect(sendFeatures.canSendMax(ethereum)).toBe(true);
  });

  it("should return false for canSendMax when descriptor sets canSendMax to false (xrp)", () => {
    const xrp = getCryptoCurrencyById("ripple");
    expect(sendFeatures.canSendMax(xrp)).toBe(false);
  });

  it("should return true for canSendMax when currency is undefined (default)", () => {
    expect(sendFeatures.canSendMax(undefined)).toBe(true);
  });

  it("should return null for getCustomFeeConfig when currency has no custom fees (solana)", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getCustomFeeConfig(solana)).toBeNull();
  });

  it("should return null for getCustomFeeConfig when currency is undefined", () => {
    expect(sendFeatures.getCustomFeeConfig(undefined)).toBeNull();
  });

  it("should return custom fee config for bitcoin with inputs and builders", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    const config = sendFeatures.getCustomFeeConfig(bitcoin);
    expect(config).not.toBeNull();
    expect(config?.inputs).toHaveLength(1);
    expect(config?.inputs[0]).toMatchObject({
      key: "feePerByte",
      type: "number",
      unitLabel: "sat/vbyte",
    });
    expect(typeof config?.getInitialValues).toBe("function");
    expect(typeof config?.buildTransactionPatch).toBe("function");
  });

  it("should return custom fee config for ethereum with EIP-1559 inputs", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const config = sendFeatures.getCustomFeeConfig(ethereum);
    expect(config).not.toBeNull();
    expect(config?.inputs.length).toBeGreaterThanOrEqual(2);
    expect(config?.inputs.map(i => i.key)).toContain("maxFeePerGas");
    expect(typeof config?.getInitialValues).toBe("function");
    expect(typeof config?.buildTransactionPatch).toBe("function");
  });

  it("should return empty fee preset options when not implemented", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.getFeePresetOptions(solana, {})).toEqual([]);
  });

  it("should expose fee preset options for bitcoin from descriptor", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    const options = sendFeatures.getFeePresetOptions(bitcoin, {
      networkInfo: {
        feeItems: {
          items: [
            { speed: "slow", feePerByte: new BigNumber(1) },
            { speed: "medium", feePerByte: new BigNumber(2) },
          ],
        },
      },
    });

    expect(options).toEqual([
      { id: "medium", amount: new BigNumber(2) },
      { id: "slow", amount: new BigNumber(1) },
    ]);
  });

  it("should expose fee preset options for evm from descriptor", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    const options = sendFeatures.getFeePresetOptions(ethereum, {
      gasLimit: new BigNumber(21_000),
      gasOptions: {
        slow: { maxFeePerGas: new BigNumber(10), gasPrice: null },
        medium: { maxFeePerGas: new BigNumber(20), gasPrice: null },
        fast: { gasPrice: new BigNumber(30) },
      },
    });

    expect(options.map(o => o.id)).toEqual(["slow", "medium", "fast"]);
    expect(options.find(o => o.id === "slow")?.amount).toEqual(new BigNumber(10).times(21_000));
    expect(options.find(o => o.id === "medium")?.amount).toEqual(new BigNumber(20).times(21_000));
    expect(options.find(o => o.id === "fast")?.amount).toEqual(new BigNumber(30).times(21_000));
  });

  it("should expose fee preset options for kaspa from descriptor", () => {
    const kaspa = getCryptoCurrencyById("kaspa");
    const options = sendFeatures.getFeePresetOptions(kaspa, {
      networkInfo: [
        { label: "slow", amount: new BigNumber(1), estimatedSeconds: 10 },
        { label: "medium", amount: new BigNumber(2), estimatedSeconds: 10 },
        { label: "fast", amount: new BigNumber(3), estimatedSeconds: 10 },
      ],
    });

    expect(options).toEqual([
      { id: "slow", amount: new BigNumber(1), estimatedMs: 10_000, disabled: true },
      { id: "medium", amount: new BigNumber(2), estimatedMs: 10_000, disabled: true },
      { id: "fast", amount: new BigNumber(3), estimatedMs: 10_000, disabled: false },
    ]);
  });

  it("should return false when bridge estimation is not specified", () => {
    const solana = getCryptoCurrencyById("solana");
    expect(sendFeatures.shouldEstimateFeePresetsWithBridge(solana, {})).toBe(false);
  });

  it("should require bridge estimation for bitcoin presets", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.shouldEstimateFeePresetsWithBridge(bitcoin, {})).toBe(true);
  });

  it("should return empty plugins when not specified", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    expect(sendFeatures.getAmountPlugins(bitcoin)).toEqual([]);
  });

  it("should expose amount plugins for evm", () => {
    const ethereum = getCryptoCurrencyById("ethereum");
    expect(sendFeatures.getAmountPlugins(ethereum)).toEqual(["evmGasOptionsSync"]);
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
    expect(sendFeatures.getMemoDefaultOption(stellar)).toBe("MEMO_TEXT");
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
