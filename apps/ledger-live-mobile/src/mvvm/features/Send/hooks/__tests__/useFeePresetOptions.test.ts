import { renderHook } from "@testing-library/react-native";
import { useFeePresetOptions } from "../useFeePresetOptions";
import { sendFeatures } from "@ledgerhq/live-common/bridge/descriptor/send/features";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

jest.mock("@ledgerhq/live-common/bridge/descriptor/send/features");

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

describe("useFeePresetOptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .mocked(sendFeatures.getFeePresetOptions)
      .mockReturnValue(mockPresets as ReturnType<typeof sendFeatures.getFeePresetOptions>);
  });

  it("delegates to sendFeatures.getFeePresetOptions with the current transaction", () => {
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

  it("recomputes when the transaction changes", () => {
    const tx1 = { family: "bitcoin", amount: 1 } as unknown as Transaction;
    const tx2 = { family: "bitcoin", amount: 2 } as unknown as Transaction;

    const { rerender } = renderHook<ReturnType<typeof useFeePresetOptions>, { tx: Transaction }>(
      ({ tx }) => useFeePresetOptions(mockCurrency, tx),
      {
        initialProps: { tx: tx1 },
      },
    );

    expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(mockCurrency, tx1);

    rerender({ tx: tx2 });

    expect(sendFeatures.getFeePresetOptions).toHaveBeenCalledWith(mockCurrency, tx2);
  });

  it("recomputes when currency changes", () => {
    const otherCurrency = { id: "ethereum", family: "evm" } as unknown as CryptoOrTokenCurrency;

    const { rerender } = renderHook<
      ReturnType<typeof useFeePresetOptions>,
      { currency: CryptoOrTokenCurrency }
    >(({ currency }) => useFeePresetOptions(currency, btcTransaction), {
      initialProps: { currency: mockCurrency },
    });

    rerender({ currency: otherCurrency });

    expect(sendFeatures.getFeePresetOptions).toHaveBeenLastCalledWith(
      otherCurrency,
      btcTransaction,
    );
  });
});
