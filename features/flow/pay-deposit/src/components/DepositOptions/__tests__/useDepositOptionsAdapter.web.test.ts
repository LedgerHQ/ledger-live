import { act, renderHook } from "@testing-library/react";
import { useDepositOptionsAdapter } from "../useDepositOptionsAdapter";

describe("useDepositOptionsAdapter", () => {
  it("starts closed and toggles isOpen via open and onClose", () => {
    const { result } = renderHook(() =>
      useDepositOptionsAdapter({ page: "Pay", onSelect: jest.fn() }),
    );

    expect(result.current.depositOptions.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.depositOptions.isOpen).toBe(true);

    act(() => result.current.depositOptions.onClose());
    expect(result.current.depositOptions.isOpen).toBe(false);
  });

  it("passes page, onSelect and onTrackEvent through into depositOptions", () => {
    const onSelect = jest.fn();
    const onTrackEvent = jest.fn();

    const { result } = renderHook(() =>
      useDepositOptionsAdapter({ page: "Pay", onSelect, onTrackEvent }),
    );

    const { depositOptions } = result.current;
    expect(depositOptions.page).toBe("Pay");
    expect(depositOptions.onSelect).toBe(onSelect);
    expect(depositOptions.onTrackEvent).toBe(onTrackEvent);
  });
});
