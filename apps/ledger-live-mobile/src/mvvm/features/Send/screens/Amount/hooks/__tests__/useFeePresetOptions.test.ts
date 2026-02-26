import { renderHook } from "@testing-library/react-native";
import { useFeePresetOptions } from "../useFeePresetOptions";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-common/bridge/descriptor");

const mockCurrency = { id: "bitcoin", family: "bitcoin" } as unknown as CryptoOrTokenCurrency;

const mockPresets = [
  { id: "slow", amount: new BigNumber(1000), estimatedMs: undefined, disabled: undefined },
  { id: "medium", amount: new BigNumber(2000), estimatedMs: undefined, disabled: undefined },
  { id: "fast", amount: new BigNumber(3000), estimatedMs: undefined, disabled: undefined },
];

const btcTransaction = {
  family: "bitcoin",
  recipient: "",
} as unknown as Transaction;

const evmTransaction = {
  family: "evm",
  recipient: "",
  gasOptions: null,
} as unknown as Transaction;

const distinctGasOptions = {
  slow: { maxFeePerGas: 10, maxPriorityFeePerGas: 1 },
  medium: { maxFeePerGas: 20, maxPriorityFeePerGas: 2 },
  fast: { maxFeePerGas: 30, maxPriorityFeePerGas: 3 },
};

const identicalGasOptions = {
  slow: { maxFeePerGas: 10 },
  medium: { maxFeePerGas: 10 },
  fast: { maxFeePerGas: 10 },
};

describe("useFeePresetOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(sendFeatures.getFeePresetOptions)
      .mockReturnValue(mockPresets as ReturnType<typeof sendFeatures.getFeePresetOptions>);
  });

  describe("non-EVM transactions", () => {
    it("delegates to sendFeatures.getFeePresetOptions", () => {
      const { result } = renderHook(() => useFeePresetOptions(mockCurrency, btcTransaction));

      expect(result.current).toEqual(mockPresets);
      expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(mockCurrency, btcTransaction);
    });

    it("handles undefined currency", () => {
      renderHook(() => useFeePresetOptions(undefined, btcTransaction));

      expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(undefined, btcTransaction);
    });

    it("returns empty array when sendFeatures returns none", () => {
      jest.mocked(sendFeatures.getFeePresetOptions).mockReturnValue([]);

      const { result } = renderHook(() => useFeePresetOptions(mockCurrency, btcTransaction));

      expect(result.current).toEqual([]);
    });
  });

  describe("EVM transactions with distinct gasOptions", () => {
    it("passes the transaction with gasOptions to sendFeatures", () => {
      const evmTxWithOptions = {
        ...evmTransaction,
        gasOptions: distinctGasOptions,
      } as unknown as Transaction;

      renderHook(() => useFeePresetOptions(mockCurrency, evmTxWithOptions));

      expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(
        mockCurrency,
        expect.objectContaining({ gasOptions: distinctGasOptions }),
      );
    });

    it("returns presets when gasOptions are distinct", () => {
      const evmTxWithOptions = {
        ...evmTransaction,
        gasOptions: distinctGasOptions,
      } as unknown as Transaction;

      const { result } = renderHook(() => useFeePresetOptions(mockCurrency, evmTxWithOptions));

      expect(result.current).toEqual(mockPresets);
    });
  });

  describe("EVM gasOptions caching", () => {
    it("uses cached distinct gasOptions when new ones are identical", () => {
      const { rerender } = renderHook(
        ({ gasOptions }: { gasOptions: unknown }) =>
          useFeePresetOptions(mockCurrency, {
            ...evmTransaction,
            gasOptions,
          } as unknown as Transaction),
        { initialProps: { gasOptions: distinctGasOptions } },
      );

      jest.mocked(sendFeatures.getFeePresetOptions).mockClear();

      rerender({ gasOptions: identicalGasOptions });

      // Should be called with the cached distinct options, not the identical ones
      expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(
        mockCurrency,
        expect.objectContaining({ gasOptions: distinctGasOptions }),
      );
    });

    it("updates cache when distinct gasOptions change", () => {
      const updatedDistinctGasOptions = {
        slow: { maxFeePerGas: 100 },
        medium: { maxFeePerGas: 200 },
        fast: { maxFeePerGas: 300 },
      };

      const { rerender } = renderHook(
        ({ gasOptions }: { gasOptions: unknown }) =>
          useFeePresetOptions(mockCurrency, {
            ...evmTransaction,
            gasOptions,
          } as unknown as Transaction),
        { initialProps: { gasOptions: distinctGasOptions } },
      );

      jest.mocked(sendFeatures.getFeePresetOptions).mockClear();

      rerender({ gasOptions: updatedDistinctGasOptions });

      expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(
        mockCurrency,
        expect.objectContaining({ gasOptions: updatedDistinctGasOptions }),
      );
    });

    it("falls back to transaction without gasOptions when cache is empty and options are identical", () => {
      const { result } = renderHook(() =>
        useFeePresetOptions(mockCurrency, {
          ...evmTransaction,
          gasOptions: identicalGasOptions,
        } as unknown as Transaction),
      );

      // No cached distinct options yet → should still return presets (using whatever sendFeatures returns)
      expect(result.current).toEqual(mockPresets);
    });
  });

  describe("reactivity", () => {
    it("recomputes when currency changes", () => {
      const otherCurrency = { id: "ethereum", family: "evm" } as unknown as CryptoOrTokenCurrency;

      const { rerender } = renderHook(
        ({ currency }: { currency: CryptoOrTokenCurrency }) =>
          useFeePresetOptions(currency, btcTransaction),
        { initialProps: { currency: mockCurrency } },
      );

      rerender({ currency: otherCurrency });

      expect(sendFeatures.getFeePresetOptions).toHaveBeenLastCalledWith(
        otherCurrency,
        btcTransaction,
      );
    });

    it("recomputes when transaction family changes", () => {
      const { rerender } = renderHook(
        ({ transaction }: { transaction: Transaction }) =>
          useFeePresetOptions(mockCurrency, transaction),
        { initialProps: { transaction: btcTransaction } },
      );

      const evmTxWithOptions = {
        ...evmTransaction,
        gasOptions: distinctGasOptions,
      } as unknown as Transaction;

      rerender({ transaction: evmTxWithOptions });

      expect(sendFeatures.getFeePresetOptions).toHaveBeenLastCalledWith(
        mockCurrency,
        expect.objectContaining({ family: "evm" }),
      );
    });
  });
});
