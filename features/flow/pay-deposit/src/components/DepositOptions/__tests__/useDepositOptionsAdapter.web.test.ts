import { act, renderHook } from "@testing-library/react";
import type { DepositOptionsLabels } from "../../../types";
import { useDepositOptionsAdapter } from "../useDepositOptionsAdapter";

const labels: DepositOptionsLabels = {
  title: "Add stablecoins",
  options: {
    bankTransfer: { title: "Bank transfer", description: "Transfer USD or EUR." },
    swap: { title: "Swap from crypto", description: "Swap your crypto." },
    receive: { title: "Crypto address", description: "Receive from another wallet." },
    buy: { title: "Buy", description: "Buy with credit card." },
  },
};

describe("useDepositOptionsAdapter", () => {
  it("starts closed and toggles isOpen via open and onClose", () => {
    const { result } = renderHook(() =>
      useDepositOptionsAdapter({ labels, page: "Pay", onSelect: jest.fn() }),
    );

    expect(result.current.depositOptions.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.depositOptions.isOpen).toBe(true);

    act(() => result.current.depositOptions.onClose());
    expect(result.current.depositOptions.isOpen).toBe(false);
  });

  it("passes page, labels, onSelect and onTrackEvent through into depositOptions", () => {
    const onSelect = jest.fn();
    const onTrackEvent = jest.fn();

    const { result } = renderHook(() =>
      useDepositOptionsAdapter({ labels, page: "Pay", onSelect, onTrackEvent }),
    );

    const { depositOptions } = result.current;
    expect(depositOptions.page).toBe("Pay");
    expect(depositOptions.labels).toBe(labels);
    expect(depositOptions.onSelect).toBe(onSelect);
    expect(depositOptions.onTrackEvent).toBe(onTrackEvent);
  });
});
