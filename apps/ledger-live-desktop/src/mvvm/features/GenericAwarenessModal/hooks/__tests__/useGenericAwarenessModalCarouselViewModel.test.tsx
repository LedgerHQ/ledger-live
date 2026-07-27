import { act } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { appStartFeatureIntroCard, carouselCampaignCard } from "../../testUtils/fixtures";
import useGenericAwarenessModalCarouselViewModel from "../useGenericAwarenessModalCarouselViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

const mockLogClick = jest.fn();
const mockLogDismiss = jest.fn();

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("useGenericAwarenessModalCarouselViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["undefined content card", undefined],
    ["non-carousel content card", appStartFeatureIntroCard],
  ] as const)("should return empty slides for %s", (_label, contentCard) => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(contentCard, false, mockLogClick, mockLogDismiss),
    );

    expect(result.current.slides).toEqual([]);
  });

  it("should expose carousel slides from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(
        carouselCampaignCard,
        true,
        mockLogClick,
        mockLogDismiss,
      ),
    );

    expect(result.current.slides).toEqual(carouselCampaignCard.data);
  });

  it("should close dialog and log Braze dismiss when onCompleteClose is called", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(
        carouselCampaignCard,
        true,
        mockLogClick,
        mockLogDismiss,
      ),
    );

    act(() => {
      result.current.onCompleteClose();
    });

    expect(mockLogDismiss).toHaveBeenCalledTimes(1);
    expect(mockLogClick).not.toHaveBeenCalled();
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalledWith({
      dismissAppStart: true,
    });
  });

  it("should log Braze click when onSlidePrimaryClick is called", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(
        carouselCampaignCard,
        true,
        mockLogClick,
        mockLogDismiss,
      ),
    );
    const slide = carouselCampaignCard.data[0];

    act(() => {
      result.current.onSlidePrimaryClick(slide);
    });

    expect(mockLogClick).toHaveBeenCalledTimes(1);
    expect(mockLogDismiss).not.toHaveBeenCalled();
    expect(openURL).toHaveBeenCalledWith(slide.primaryButtonLink);
  });
});
