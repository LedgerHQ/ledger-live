import { renderHook } from "@testing-library/react";
import { receiveTestWrapper } from "../__tests__/receiveTestStore";
import { useReceiveAddressCopy } from "./useReceiveAddressCopy";

describe("useReceiveAddressCopy", () => {
  it("should name the asset received and its network", () => {
    const { result } = renderHook(
      () => useReceiveAddressCopy({ assetTicker: "USDC", networkName: "Ethereum" }),
      { wrapper: receiveTestWrapper() },
    );

    expect(result.current).toEqual(
      expect.objectContaining({ title: "Receive USDC", networkLabel: "Ethereum network" }),
    );
  });
});
