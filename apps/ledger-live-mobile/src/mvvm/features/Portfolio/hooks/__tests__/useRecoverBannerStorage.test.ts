import { act, renderHook, waitFor } from "@tests/test-renderer";
import { getStoreValue, setStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import useRecoverBannerStorage from "../useRecoverBannerStorage";

jest.mock("~/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

const mockGetStoreValue = jest.mocked(getStoreValue);
const mockSetStoreValue = jest.mocked(setStoreValue);

const PROTECT_ID = "protect-prod";

describe("useRecoverBannerStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("loading from storage", () => {
    it("reads SUBSCRIPTION_STATE and DISPLAY_BANNER with the given protectId", async () => {
      mockGetStoreValue.mockResolvedValue(undefined);

      renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      await waitFor(() => {
        expect(mockGetStoreValue).toHaveBeenCalledWith("SUBSCRIPTION_STATE", PROTECT_ID);
        expect(mockGetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", PROTECT_ID);
      });
    });

    it("populates data with mapped storage values", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      await waitFor(() =>
        expect(result.current.data).toEqual({
          subscriptionState: LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
          displayBanner: true,
        }),
      );
    });

    it("defaults subscriptionState to NO_SUBSCRIPTION when storage is empty", async () => {
      mockGetStoreValue.mockResolvedValueOnce(undefined).mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      await waitFor(() =>
        expect(result.current.data?.subscriptionState).toBe(
          LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION,
        ),
      );
    });

    it.each(["false", undefined])(
      "sets displayBanner to false when storage value is %s",
      async value => {
        mockGetStoreValue
          .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
          .mockResolvedValueOnce(value);

        const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

        await waitFor(() => expect(result.current.data?.displayBanner).toBe(false));
      },
    );

    it("keeps data undefined when storage throws", async () => {
      mockGetStoreValue.mockRejectedValue(new Error("storage error"));

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalled());
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("dismissBanner", () => {
    it("writes DISPLAY_BANNER as false to storage", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));
      await waitFor(() => expect(result.current.data?.displayBanner).toBe(true));

      act(() => result.current.dismissBanner());

      expect(mockSetStoreValue).toHaveBeenCalledWith("DISPLAY_BANNER", "false", PROTECT_ID);
    });

    it("optimistically sets displayBanner to false without waiting for storage", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));
      await waitFor(() => expect(result.current.data?.displayBanner).toBe(true));

      act(() => result.current.dismissBanner());

      expect(result.current.data?.displayBanner).toBe(false);
    });

    it("preserves other state fields when dismissing", async () => {
      mockGetStoreValue
        .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION)
        .mockResolvedValueOnce("true");

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));
      await waitFor(() => expect(result.current.data).toBeDefined());

      act(() => result.current.dismissBanner());

      expect(result.current.data?.subscriptionState).toBe(
        LedgerRecoverSubscriptionStateEnum.BACKUP_DEVICE_CONNECTION,
      );
    });

    it("does not modify data when called before storage has loaded", () => {
      mockGetStoreValue.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useRecoverBannerStorage(PROTECT_ID));

      act(() => result.current.dismissBanner());

      expect(result.current.data).toBeUndefined();
    });
  });
});
