import { renderHook } from "@testing-library/react";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { usePayCardBalanceViewModel } from "../usePayCardBalanceViewModel";
import type { PayCardBalanceProps } from "../types";

const labels = {
  emptyTitle: "Pay and get paid",
  emptyDescription: "Start by depositing stablecoin to your wallet",
};

const formatCountervalue = (): FormattedValue => ({}) as unknown as FormattedValue;

function buildProps(overrides: Partial<PayCardBalanceProps> = {}): PayCardBalanceProps {
  return {
    status: "ready",
    stableBalance: 0,
    filter: "all",
    formatCountervalue,
    labels,
    ...overrides,
  };
}

describe("usePayCardBalanceViewModel", () => {
  it("should be empty when the stable balance is zero", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ stableBalance: 0 })),
    );

    expect(result.current.displayMode).toBe("empty");
  });

  it("should be funded when the stable balance is positive and ready", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ status: "ready", stableBalance: 1250.5 })),
    );

    expect(result.current).toMatchObject({
      displayMode: "funded",
      balance: 1250.5,
      filter: "all",
      isLoading: false,
    });
  });

  it("should be funded and loading while the balance loads", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ status: "loading", stableBalance: 0 })),
    );

    expect(result.current).toMatchObject({ displayMode: "funded", isLoading: true });
  });

  it("should be empty on error", () => {
    const { result } = renderHook(() =>
      usePayCardBalanceViewModel(buildProps({ status: "error", stableBalance: 1250.5 })),
    );

    expect(result.current.displayMode).toBe("empty");
  });
});
