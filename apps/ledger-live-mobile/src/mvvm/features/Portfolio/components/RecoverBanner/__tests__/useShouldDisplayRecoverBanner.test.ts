import { renderHook, waitFor } from "@tests/test-renderer";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import useShouldDisplayRecoverBanner from "../useShouldDisplayRecoverBanner";
import { withBannerEnabled, withRecoverState } from "../../../utils/recoverTestHelpers";

jest.mock("../useAddRecoverPostOnboardingAction", () => ({
  useAddRecoverPostOnboardingAction: jest.fn(),
}));

describe("useShouldDisplayRecoverBanner", () => {
  it("returns true when all conditions are met", async () => {
    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: state =>
        withBannerEnabled(
          withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, true)(state),
        ),
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it("returns false when displayBanner is false in Redux", () => {
    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: state =>
        withBannerEnabled(
          withRecoverState(LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE, false)(state),
        ),
    });

    expect(result.current).toBe(false);
  });

  it("returns false when subscription state is not in progress", () => {
    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: state =>
        withBannerEnabled(
          withRecoverState(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION, true)(state),
        ),
    });

    expect(result.current).toBe(false);
  });

  it("returns false when banner feature flag is disabled", () => {
    const { result } = renderHook(() => useShouldDisplayRecoverBanner(), {
      overrideInitialState: withRecoverState(
        LedgerRecoverSubscriptionStateEnum.STARGATE_SUBSCRIBE,
        true,
      ),
    });

    expect(result.current).toBe(false);
  });
});
