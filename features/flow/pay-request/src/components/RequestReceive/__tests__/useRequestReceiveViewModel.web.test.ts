import { renderHook } from "@testing-library/react";
import { i18nWrapper, REQUEST_RESOURCES } from "../../../__tests__/i18nWrapper";
import type { RequestReceiveViewModelParams } from "../../../types";
import { useRequestReceiveViewModel } from "../useRequestReceiveViewModel";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

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
    ...overrides,
  };
  const { result } = renderHook(() => useRequestReceiveViewModel(props), {
    wrapper: i18nWrapper(REQUEST_RESOURCES),
  });
  return { props, result };
}

describe("useRequestReceiveViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exposes translated title, network label, address, address parts and QR payload", () => {
    const { result } = setup();

    expect(result.current.title).toBe("Request Ethereum");
    expect(result.current.networkLabel).toBe("Ethereum network");
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
    ["onCopy", "copy"],
    ["onSave", "save"],
    ["onVerify", "verify"],
  ] as const)("tracks then invokes the injected callback for %s", (handler, button) => {
    const { props, result } = setup();

    result.current[handler]();

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button,
      buttonLocation: "request",
      page: "Pay",
      flow: "request",
    });
    expect(props[handler]).toHaveBeenCalledWith(ADDRESS);
  });

  it.each(["onShare", "onSave"] as const)(
    "neither tracks nor throws when the optional %s callback is omitted",
    handler => {
      const { result } = setup({ [handler]: undefined });

      expect(() => result.current[handler]()).not.toThrow();
      expect(trackButtonClicked).not.toHaveBeenCalled();
    },
  );
});
