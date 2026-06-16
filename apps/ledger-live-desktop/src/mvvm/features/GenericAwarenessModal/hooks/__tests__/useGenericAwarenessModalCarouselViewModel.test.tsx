import { act } from "tests/testSetup";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { appStartFeatureIntroCard, carouselCampaignCard } from "../../testUtils/fixtures";
import useGenericAwarenessModalCarouselViewModel from "../useGenericAwarenessModalCarouselViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("useGenericAwarenessModalCarouselViewModel", () => {
  it.each([
    ["undefined content card", undefined],
    ["non-carousel content card", appStartFeatureIntroCard],
  ] as const)("should return empty slides for %s", (_label, contentCard) => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(contentCard, false),
    );

    expect(result.current.slides).toEqual([]);
  });

  it("should expose carousel slides from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(carouselCampaignCard, true),
    );

    expect(result.current.slides).toEqual(carouselCampaignCard.data);
  });

  it("should close dialog when onClose is called", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(carouselCampaignCard, true),
    );

    act(() => {
      result.current.onClose();
    });

    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalledWith({
      dismissAppStart: true,
    });
  });
});
