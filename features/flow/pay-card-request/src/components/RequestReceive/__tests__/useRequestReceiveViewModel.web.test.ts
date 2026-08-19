import { renderHook } from "@testing-library/react";
import type { RequestReceiveViewModelParams } from "../../../types";
import { useRequestReceiveViewModel } from "../useRequestReceiveViewModel";

const ADDRESS = "0x1234567890abcdef1234567890abcdef";

function setup(overrides: Partial<RequestReceiveViewModelParams> = {}) {
  const props: RequestReceiveViewModelParams = {
    address: ADDRESS,
    asset: { name: "Ethereum", ticker: "ETH" },
    network: "Ethereum",
    page: "Pay",
    onShare: jest.fn(),
    onCopy: jest.fn(),
    onSave: jest.fn(),
    onVerify: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useRequestReceiveViewModel(props));
  return { props, result };
}

describe("useRequestReceiveViewModel", () => {
  it("exposes asset, network, address, address parts and QR payload", () => {
    const { result } = setup();

    expect(result.current.asset).toEqual({ name: "Ethereum", ticker: "ETH" });
    expect(result.current.network).toBe("Ethereum");
    expect(result.current.address).toBe(ADDRESS);
    expect(result.current.addressParts).toEqual({
      start: "0x123456",
      middle: "7890abcdef12345678",
      end: "90abcdef",
    });
    expect(result.current.qrPayload).toBe(ADDRESS);
  });

  it.each([
    ["onShare", "share"],
    ["onCopy", "copy address"],
    ["onSave", "save"],
    ["onVerify", "verify on device"],
  ] as const)("tracks then invokes the injected callback for %s", (handler, button) => {
    const { props, result } = setup();

    result.current[handler]();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button,
      buttonLocation: "request",
      page: "Pay",
    });
    expect(props[handler]).toHaveBeenCalledWith(ADDRESS);
  });

  it("does not throw when no tracker is provided", () => {
    const { props, result } = setup({ onTrackEvent: undefined });

    expect(() => result.current.onCopy()).not.toThrow();
    expect(props.onCopy).toHaveBeenCalledWith(ADDRESS);
  });
});
