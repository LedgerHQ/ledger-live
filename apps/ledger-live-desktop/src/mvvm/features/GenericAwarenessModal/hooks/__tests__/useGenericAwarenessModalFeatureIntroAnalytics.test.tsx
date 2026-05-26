import { act } from "tests/testSetup";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { appStartFeatureIntroCard } from "../../__tests__/fixtures";
import { AWARENESS_MODAL_DISMISS_METHOD } from "../../analytics/const";
import useGenericAwarenessModalFeatureIntroAnalytics from "../useGenericAwarenessModalFeatureIntroAnalytics";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("useGenericAwarenessModalFeatureIntroAnalytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should track page when feature intro opens", () => {
    renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroAnalytics(appStartFeatureIntroCard, true),
    );

    expect(trackPage).toHaveBeenCalledWith(
      "Awareness Modal Feature Intro",
      undefined,
      expect.objectContaining({ contentId: appStartFeatureIntroCard.id }),
      true,
      false,
    );
  });

  it("should track primary, secondary, close, and dismiss interactions", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroAnalytics(appStartFeatureIntroCard, true),
    );

    act(() => {
      result.current.onPrimaryClick();
    });
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "got it", ctaPosition: "primary" }),
    );
    expect(openURL).toHaveBeenCalledWith(appStartFeatureIntroCard.primaryButtonLink);
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();

    jest.clearAllMocks();

    act(() => {
      result.current.onSecondaryClick();
    });
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "compare signers", ctaPosition: "secondary" }),
    );

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
      expect.objectContaining({
        dismissMethod: AWARENESS_MODAL_DISMISS_METHOD.backdropTap,
        contentId: appStartFeatureIntroCard.id,
      }),
    );
  });
});
