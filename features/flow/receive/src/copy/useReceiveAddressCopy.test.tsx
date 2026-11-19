import { renderHook } from "@testing-library/react";
import { receiveTestWrapper } from "../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "./useReceiveAddressCopy";

describe("useReceiveAddressCopy", () => {
  it("should name the asset received and its network", () => {
    const { result } = renderHook(
      () => useReceiveAddressCopy({ assetTicker: "USDC", networkName: "Ethereum" }),
      { wrapper: receiveTestWrapper() },
    );

    expect(result.current).toEqual({
      title: "Receive USDC",
      networkLabel: "Ethereum network",
      closeLabel: "Close",
      backLabel: "Back",
      selectAddressTitle: "Select address",
      addressOptionLabels: { transparent: "Public address", shielded: "Private address" },
      errorTitle: "We couldn't load this address",
      errorDescription: "Check your internet connection, then try again.",
      retryLabel: "Retry",
    });
  });
});
