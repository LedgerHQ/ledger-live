import { act, renderHook } from "@testing-library/react";
import { useBalanceViewModel } from "../components/Hero/useBalanceViewModel";
import type { BalanceProps } from "../types";
import { USDC_ID, formatCountervalue, options } from "./fixtures";
import { i18nWrapper } from "./i18nWrapper";

function buildProps(overrides: Partial<BalanceProps> = {}): BalanceProps {
  return {
    status: "ready",
    stableBalance: 0,
    filter: "all",
    hasBalance: false,
    filterOptions: options,
    formatCountervalue,
    onConfirmFilter: jest.fn(),
    ...overrides,
  };
}

function renderBalanceViewModel(props: BalanceProps) {
  return renderHook(() => useBalanceViewModel(props), { wrapper: i18nWrapper() });
}

describe("useBalanceViewModel", () => {
  it("should be empty when the user has no balance", () => {
    const actionTiles = { page: "Pay", tiles: [] };
    const { result } = renderBalanceViewModel(buildProps({ hasBalance: false, actionTiles }));

    expect(result.current).toMatchObject({
      displayMode: "empty",
      actionTiles,
    });
  });

  it("should be funded when the user has balance and is ready", () => {
    const { result } = renderBalanceViewModel(
      buildProps({ hasBalance: true, stableBalance: 1250.5 }),
    );

    expect(result.current).toMatchObject({
      displayMode: "funded",
      balance: 1250.5,
      filter: "all",
      isLoading: false,
    });
  });

  it("should keep funded chrome and skeleton the amount while funded data loads", () => {
    const { result } = renderBalanceViewModel(
      buildProps({ status: "loading", hasBalance: true, stableBalance: 1250.5 }),
    );

    expect(result.current).toMatchObject({
      displayMode: "funded",
      balance: 1250.5,
      isLoading: true,
    });
  });

  it("should stay empty while data loads if the user has no balance", () => {
    const { result } = renderBalanceViewModel(buildProps({ status: "loading", hasBalance: false }));

    expect(result.current.displayMode).toBe("empty");
  });

  it("should stay funded on error if the user has a balance", () => {
    const { result } = renderBalanceViewModel(
      buildProps({ status: "error", hasBalance: true, stableBalance: 1250.5 }),
    );

    expect(result.current).toMatchObject({
      displayMode: "funded",
      balance: 1250.5,
      isLoading: false,
    });
  });

  it("should stay empty on error if the user has no balance", () => {
    const { result } = renderBalanceViewModel(buildProps({ status: "error", hasBalance: false }));

    expect(result.current.displayMode).toBe("empty");
  });

  it("should expose the selected option for a valid filter", () => {
    const { result } = renderBalanceViewModel(buildProps({ hasBalance: true, filter: USDC_ID }));

    expect(result.current).toMatchObject({
      displayMode: "funded",
      filter: USDC_ID,
      selectedOption: { id: USDC_ID, ticker: "USDC" },
    });
  });

  it("should open the filter and track the open event", () => {
    const onTrackEvent = jest.fn();
    const { result } = renderBalanceViewModel(buildProps({ hasBalance: true, onTrackEvent }));

    if (result.current.displayMode !== "funded") throw new Error("expected funded");
    expect(result.current.isFilterOpen).toBe(false);

    act(() => result.current.displayMode === "funded" && result.current.onOpenFilter());

    if (result.current.displayMode !== "funded") throw new Error("expected funded");
    expect(result.current.isFilterOpen).toBe(true);
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", { button: "balance_filter" });
  });

  it("should close the filter", () => {
    const { result } = renderBalanceViewModel(buildProps({ hasBalance: true }));

    act(() => result.current.displayMode === "funded" && result.current.onOpenFilter());
    act(() => result.current.displayMode === "funded" && result.current.onCloseFilter());

    if (result.current.displayMode !== "funded") throw new Error("expected funded");
    expect(result.current.isFilterOpen).toBe(false);
  });

  it("should resolve its copy from the mounted i18n provider, not from props", () => {
    const { result } = renderHook(() => useBalanceViewModel(buildProps({ hasBalance: false })), {
      wrapper: i18nWrapper({
        en: { translation: { payTab: { balance: { emptyTitle: "Payez" } } } },
      }),
    });

    if (result.current.displayMode !== "empty") throw new Error("expected empty");
    expect(result.current.labels.emptyTitle).toBe("Payez");
  });
});
