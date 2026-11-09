/**
 * @jest-environment jsdom
 */
import { createElement, type ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { BridgeSyncContext } from "../../../bridge/react/context";
import { getRecentAddressesStore } from "../../../account/index";
import { liveCommonSendFlowPorts } from "../ports";

jest.mock("../../../account/index", () => ({
  getRecentAddressesStore: jest.fn(),
}));

describe("liveCommonSendFlowPorts", () => {
  it("syncs one account through the bridge sync context", () => {
    const sync = jest.fn();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(BridgeSyncContext.Provider, { value: sync }, children);

    const { result } = renderHook(() => liveCommonSendFlowPorts.useAccountSync(), { wrapper });
    result.current({ accountId: "acc-1", priority: 100, reason: "transaction-flow-init" });

    expect(sync).toHaveBeenCalledWith({
      type: "SYNC_ONE_ACCOUNT",
      accountId: "acc-1",
      priority: 100,
      reason: "transaction-flow-init",
    });
  });

  it("records recent addresses in the recent-addresses store", () => {
    const addAddress = jest.fn();
    jest.mocked(getRecentAddressesStore).mockReturnValue({
      addAddress,
    } as unknown as ReturnType<typeof getRecentAddressesStore>);

    liveCommonSendFlowPorts.addRecentAddress("ethereum", "0xabc", "vitalik.eth");

    expect(addAddress).toHaveBeenCalledWith("ethereum", "0xabc", "vitalik.eth");
  });

  it("returns no sponsored seam for a non-local kind", async () => {
    await expect(liveCommonSendFlowPorts.getSponsoredCoinApi("tron", "remote")).resolves.toBeNull();
  });
});
