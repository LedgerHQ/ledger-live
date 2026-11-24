import { act, renderHook, waitFor } from "@testing-library/react";
import {
  mockAddressAccountDescriptor,
  computeAccountUUID,
} from "@domain/entity-account-descriptor/schema.mock";
import { mockAccountStatus, mockAssetStatus } from "@domain/entity-account-status/schema.mock";
import { CryptoOrTokenCurrencyIdSchema } from "@domain/entity-currency";
import {
  makeReceiveTestStore,
  receiveTestWrapper,
  testAccountUUID as accountUUID,
  testDescriptor as descriptor,
  testReceive as receive,
} from "../../__tests__/receiveTestStore";
import { useReceiveScreenData } from "./useReceiveScreenData";

const ETH = CryptoOrTokenCurrencyIdSchema.parse("ethereum");
const USDC = CryptoOrTokenCurrencyIdSchema.parse(
  "ethereum/erc20/usd__coin_0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
);

const setup = (reads: Parameters<typeof makeReceiveTestStore>[0]) => ({
  wrapper: receiveTestWrapper(makeReceiveTestStore(reads)),
});

describe("useReceiveScreenData", () => {
  it("should load, then be ready with the account's receive", async () => {
    const { wrapper } = setup({});
    const { result } = renderHook(() => useReceiveScreenData(accountUUID, ETH), { wrapper });

    expect(result.current.data).toEqual({ type: "loading" });
    await waitFor(() => expect(result.current.data).toEqual({ type: "ready", receive }));
    expect(result.current.descriptor).toEqual(descriptor);
  });

  it("should read no asset status for the native coin", async () => {
    const assetStatus = jest.fn();
    const { wrapper } = setup({ assetStatus });
    const { result } = renderHook(() => useReceiveScreenData(accountUUID, ETH), { wrapper });

    await waitFor(() => expect(result.current.data.type).toBe("ready"));
    expect(assetStatus).not.toHaveBeenCalled();
  });

  it("should ask to activate a token the account must opt in to", async () => {
    const { wrapper } = setup({
      assetStatus: async (_target, query) => ({
        assetId: query!.assetId,
        status: mockAssetStatus({ gate: { type: "activation", method: "association" } }),
      }),
    });
    const { result } = renderHook(() => useReceiveScreenData(accountUUID, USDC), { wrapper });

    await waitFor(() =>
      expect(result.current.data).toEqual({ type: "activationRequired", method: "association" }),
    );
  });

  it("should ask to onboard the account", async () => {
    const { wrapper } = setup({
      accountStatus: async () => mockAccountStatus({ gate: { type: "onboarding" } }),
      receive: async () => Promise.reject(new Error("no address yet")),
    });
    const { result } = renderHook(() => useReceiveScreenData(accountUUID, ETH), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ type: "onboardingRequired" }));
  });

  it("should fail, then read the failed kind again on retry", async () => {
    const readReceive = jest
      .fn<Promise<typeof receive>, []>()
      .mockRejectedValueOnce(new Error("sync failed"))
      .mockResolvedValue(receive);
    const { wrapper } = setup({ receive: readReceive });
    const { result } = renderHook(() => useReceiveScreenData(accountUUID, ETH), { wrapper });

    await waitFor(() => expect(result.current.data.type).toBe("error"));
    const { data } = result.current;
    act(() => {
      if (data.type === "error") data.retry();
    });

    await waitFor(() => expect(result.current.data).toEqual({ type: "ready", receive }));
    expect(readReceive).toHaveBeenCalledTimes(2);
  });

  it("should fail for an account the account model does not hold", () => {
    const { wrapper } = setup({});
    const unknownUUID = computeAccountUUID(
      mockAddressAccountDescriptor({ key: "0x0000000000000000000000000000000000000001" }),
    );
    const { result } = renderHook(() => useReceiveScreenData(unknownUUID, ETH), { wrapper });

    expect(result.current.data.type).toBe("error");
    expect(result.current.descriptor).toBeUndefined();
  });
});
