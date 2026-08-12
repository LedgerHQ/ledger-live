import { act, renderHook } from "@testing-library/react";
import { useBalanceFilterDialogViewModel } from "../useBalanceFilterDialogViewModel";
import type { BalanceFilterDialogViewModelParams } from "../types";
import { USDC_ID, USDT_ID, options } from "./fixtures";

function buildParams(
  overrides: Partial<BalanceFilterDialogViewModelParams> = {},
): BalanceFilterDialogViewModelParams {
  return {
    isOpen: true,
    activeFilter: "all",
    options,
    onConfirmFilter: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
}

describe("useBalanceFilterDialogViewModel", () => {
  it("should seed the draft from the active filter", () => {
    const { result } = renderHook(() =>
      useBalanceFilterDialogViewModel(buildParams({ activeFilter: USDC_ID })),
    );

    expect(result.current.draftFilter).toBe(USDC_ID);
  });

  it("should update the draft when an option is selected", () => {
    const { result } = renderHook(() => useBalanceFilterDialogViewModel(buildParams()));

    act(() => result.current.onSelectDraft(USDT_ID));

    expect(result.current.draftFilter).toBe(USDT_ID);
  });

  it("should re-seed the draft when the dialog re-opens", () => {
    const { result, rerender } = renderHook(props => useBalanceFilterDialogViewModel(props), {
      initialProps: buildParams({ isOpen: false, activeFilter: USDC_ID }),
    });

    rerender(buildParams({ isOpen: true, activeFilter: USDT_ID }));

    expect(result.current.draftFilter).toBe(USDT_ID);
  });

  it("should persist the draft, track the ticker and close on confirm", () => {
    const onConfirmFilter = jest.fn();
    const onClose = jest.fn();
    const onTrackEvent = jest.fn();
    const { result } = renderHook(() =>
      useBalanceFilterDialogViewModel(
        buildParams({ activeFilter: USDC_ID, onConfirmFilter, onClose, onTrackEvent }),
      ),
    );

    act(() => result.current.onConfirm());

    expect(onConfirmFilter).toHaveBeenCalledWith(USDC_ID);
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "confirm_balance_filter",
      asset: "USDC",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should track 'all' as the asset when confirming the all option", () => {
    const onTrackEvent = jest.fn();
    const { result } = renderHook(() =>
      useBalanceFilterDialogViewModel(buildParams({ activeFilter: "all", onTrackEvent })),
    );

    act(() => result.current.onConfirm());

    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "confirm_balance_filter",
      asset: "all",
    });
  });
});
