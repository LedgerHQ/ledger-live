import { act, renderHook } from "@testing-library/react";
import { useNetworkForm } from "./useNetworkForm";

describe("useNetworkForm", () => {
  it("starts on Ethereum, which can be queried but has no address to check yet", () => {
    const { result } = renderHook(() => useNetworkForm());
    expect(result.current.network).toBe("ethereum");
    expect(result.current.canQueryNetwork).toBe(true);
    expect(result.current.canQueryAddress).toBe(false);
  });

  it("needs a chain and an address to check an address", () => {
    const { result } = renderHook(() => useNetworkForm());
    act(() => result.current.setAddress(" 0xabc "));
    expect(result.current.canQueryAddress).toBe(true);
    expect(result.current.networkFields).toEqual({
      network: "ethereum",
      address: "0xabc",
      cursor: "",
    });

    act(() => result.current.setNetwork("  "));
    expect(result.current.canQueryNetwork).toBe(false);
    expect(result.current.canQueryAddress).toBe(false);
  });
});
