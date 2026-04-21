import { renderHook, waitFor, withFlagOverrides } from "@tests/test-renderer";
import { getStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import useShouldDisplayRecoverBanner from "../useShouldDisplayRecoverBanner";

jest.mock("~/store", () => ({
  getStoreValue: jest.fn(),
}));

const mockGetStoreValue = jest.mocked(getStoreValue);

const withBannerEnabled = withFlagOverrides({
  protectServicesMobile: {
    enabled: true,
    params: { bannerSubscriptionNotification: true },
  },
});

describe("useShouldDisplayRecoverBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns true when recover banner conditions met", async () => {
    mockGetStoreValue
      .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
      .mockResolvedValueOnce("true");

    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: withBannerEnabled,
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("returns false when recover banner when display banner state false", async () => {
    mockGetStoreValue
      .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
      .mockResolvedValueOnce("false");

    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: withBannerEnabled,
    });

    await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
    expect(result.current).toBe(false);
  });

  it("returns false when recover banner when recover state is not in progress", async () => {
    mockGetStoreValue
      .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION)
      .mockResolvedValueOnce("true");

    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: withBannerEnabled,
    });

    await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
    expect(result.current).toBe(false);
  });

  it("returns false when recover banner when banner is not enabled", async () => {
    mockGetStoreValue
      .mockResolvedValueOnce(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE)
      .mockResolvedValueOnce("true");

    const { result } = renderHook(() => useShouldDisplayRecoverBanner());

    await waitFor(() => expect(mockGetStoreValue).toHaveBeenCalledTimes(2));
    expect(result.current).toBe(false);
  });
});
