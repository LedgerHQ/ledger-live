import { act, renderHook } from "@testing-library/react";
import { useBalanceFilterPickerViewModel } from "../components/Filter/useBalanceFilterPickerViewModel";
import type { BalanceFilterPickerViewModelParams } from "../types";
import { USDC_ID, USDT_ID, options } from "./fixtures";

function buildParams(
  overrides: Partial<BalanceFilterPickerViewModelParams> = {},
): BalanceFilterPickerViewModelParams {
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

describe("useBalanceFilterPickerViewModel", () => {
  it("should seed the draft from the active filter", () => {
    const { result } = renderHook(() =>
      useBalanceFilterPickerViewModel(buildParams({ activeFilter: USDC_ID })),
    );

    expect(result.current.draftFilter).toBe(USDC_ID);
  });

  it("should update the draft when an option is selected", () => {
    const { result } = renderHook(() => useBalanceFilterPickerViewModel(buildParams()));

    act(() => result.current.onSelectDraft(USDT_ID));

    expect(result.current.draftFilter).toBe(USDT_ID);
  });

  it("should re-seed the draft when the picker re-opens", () => {
    const { result, rerender } = renderHook(props => useBalanceFilterPickerViewModel(props), {
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
      useBalanceFilterPickerViewModel(
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
      useBalanceFilterPickerViewModel(buildParams({ activeFilter: "all", onTrackEvent })),
    );

    act(() => result.current.onConfirm());

    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "confirm_balance_filter",
      asset: "all",
    });
  });
});
