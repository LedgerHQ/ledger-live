import { setGenericAwarenessModalCampaignId } from "~/reducers/genericAwarenessModal";
import { handleGenericAwarenessModalDeeplink } from "../handleGenericAwarenessModalDeeplink";

describe("handleGenericAwarenessModalDeeplink", () => {
  it("should store the campaign id without opening the drawer", () => {
    const dispatch = jest.fn();
    const searchParams = new URLSearchParams({ id: "campaign-id" });

    handleGenericAwarenessModalDeeplink({
      isGenericAwarenessModalEnabled: true,
      hasCompletedOnboarding: true,
      searchParams,
      dispatch,
      config: undefined,
    });

    expect(dispatch).toHaveBeenCalledWith(setGenericAwarenessModalCampaignId("campaign-id"));
  });

  it("should ignore the deeplink when the feature is disabled", () => {
    const dispatch = jest.fn();
    const searchParams = new URLSearchParams({ id: "campaign-id" });

    const result = handleGenericAwarenessModalDeeplink({
      isGenericAwarenessModalEnabled: false,
      hasCompletedOnboarding: true,
      searchParams,
      dispatch,
      config: undefined,
    });

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
