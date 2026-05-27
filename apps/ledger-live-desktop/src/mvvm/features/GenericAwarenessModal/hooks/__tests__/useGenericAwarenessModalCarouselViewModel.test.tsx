import { act } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { appStartFeatureIntroCard, carouselCampaignCard } from "../../__tests__/fixtures";
import useGenericAwarenessModalCarouselViewModel from "../useGenericAwarenessModalCarouselViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

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

  it("should return empty slides when content card is undefined", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(undefined),
    );

    expect(result.current.slides).toEqual([]);
  });

  it("should return empty slides when content card is not a carousel", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(appStartFeatureIntroCard),
    );

    expect(result.current.slides).toEqual([]);
  });

  it("should expose carousel slides from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(carouselCampaignCard),
    );

    expect(result.current.slides).toEqual(carouselCampaignCard.data);
    expect(result.current.slides).toHaveLength(4);
  });

  it("should open slide link and close dialog on primary click", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalCarouselViewModel(carouselCampaignCard),
    );
    expect(result.current.slides[0]).toEqual(carouselCampaignCard.data[0]);

    act(() => {
      result.current.onSlidePrimaryClick(carouselCampaignCard.data[0]);
    });

    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/products/ledger-flex");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });
});
