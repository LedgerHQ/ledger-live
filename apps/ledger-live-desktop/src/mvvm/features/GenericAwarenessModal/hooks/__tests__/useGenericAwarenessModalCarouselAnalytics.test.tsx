import { act } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { carouselCampaignCard } from "../../__tests__/fixtures";
import { AWARENESS_MODAL_DISMISS_METHOD } from "../../analytics/const";
import useGenericAwarenessModalCarouselAnalytics from "../useGenericAwarenessModalCarouselAnalytics";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("useGenericAwarenessModalCarouselAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track initial page when carousel opens", () => {
    renderHookWithStore(() =>
      useGenericAwarenessModalCarouselAnalytics(carouselCampaignCard, true),
    );

    expect(trackPage).toHaveBeenCalledWith(
      "Awareness Modal Carousel",
      undefined,
      expect.objectContaining({ step: 1, navigationMethod: "initial" }),
      true,
      false,
    );
  });

  it("should track primary click, close, dismiss, and tour completion", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselAnalytics(carouselCampaignCard, true),
    );

    act(() => {
      result.current.onSlidePrimaryClick(carouselCampaignCard.data[0]);
    });
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "discover flex", ctaPosition: "primary" }),
    );
    expect(openURL).toHaveBeenCalledWith(carouselCampaignCard.data[0].primaryButtonLink);
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => {
      result.current.onHeaderClose();
    });
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "close" }),
    );

    jest.clearAllMocks();

    act(() => {
      result.current.onDismiss(AWARENESS_MODAL_DISMISS_METHOD.backdropTap);
    });
    expect(track).toHaveBeenCalledWith(
      "drawer_dismissed",
      expect.objectContaining({ dismissMethod: AWARENESS_MODAL_DISMISS_METHOD.backdropTap }),
    );

    jest.clearAllMocks();

    act(() => {
      result.current.onContinueClick(3, true);
    });
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "continue", step: 4 }),
    );
    expect(track).toHaveBeenCalledWith(
      "tour_completed",
      expect.objectContaining({ completed: "yes", step: 4 }),
    );
  });
});
