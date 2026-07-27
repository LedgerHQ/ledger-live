import { act } from "tests/testSetup";
import { appStartFeatureIntroCard, carouselCampaignCard } from "../../testUtils/fixtures";
import useGenericAwarenessModalFeatureIntroViewModel from "../useGenericAwarenessModalFeatureIntroViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

const mockLogClick = jest.fn();
const mockLogDismiss = jest.fn();

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

jest.mock("LLD/features/GenericAwarenessModal/genericAwarenessModalDialog", () => ({
  closeGenericAwarenessModalDialog: jest.fn(() => jest.fn()),
}));

describe("useGenericAwarenessModalFeatureIntroViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return empty content when content card is undefined", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(undefined, false, mockLogClick, mockLogDismiss),
    );

    expect(result.current).toEqual({
      title: "",
      subtitle: "",
      items: [],
      primaryButtonLabel: "",
      primaryButtonLink: "",
      secondaryButtonLabel: "",
      secondaryButtonLink: "",
      imageUrlLight: undefined,
      imageUrlDark: undefined,
      onPrimaryClick: expect.any(Function),
      onSecondaryClick: expect.any(Function),
      onHeaderClose: expect.any(Function),
      onDismiss: expect.any(Function),
    });
  });

  it("should return empty content when content card is not feature intro", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(
        carouselCampaignCard,
        false,
        mockLogClick,
        mockLogDismiss,
      ),
    );

    expect(result.current.title).toBe("");
    expect(result.current.items).toEqual([]);
  });

  it("should map feature intro content from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(
        appStartFeatureIntroCard,
        true,
        mockLogClick,
        mockLogDismiss,
      ),
    );

    expect(result.current.title).toBe("Connect a Ledger device");
    expect(result.current.primaryButtonLabel).toBe("Got it");
    expect(result.current.items[0]).toEqual({
      title: "Buy, swap, and stake",
      subtitle: "Build your portfolio with the simplicity of exchanges and security of a signer.",
      icon: "HandCoins",
    });
  });

  it("should fall back to LedgerLogo icon when icon name is invalid", () => {
    const cardWithInvalidIcon = {
      ...appStartFeatureIntroCard,
      items: [{ icon: "NotARealIcon", title: "Item", subtitle: "Description" }],
    };

    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(
        cardWithInvalidIcon,
        true,
        mockLogClick,
        mockLogDismiss,
      ),
    );

    expect(result.current.items[0]?.icon).toBe("LedgerLogo");
  });

  it("should log Braze click on primary click and dismiss on header close", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(
        appStartFeatureIntroCard,
        true,
        mockLogClick,
        mockLogDismiss,
      ),
    );

    act(() => {
      result.current.onPrimaryClick();
    });
    expect(mockLogClick).toHaveBeenCalledTimes(1);
    expect(mockLogDismiss).not.toHaveBeenCalled();

    act(() => {
      result.current.onHeaderClose();
    });
    expect(mockLogClick).toHaveBeenCalledTimes(1);
    expect(mockLogDismiss).toHaveBeenCalledTimes(1);
  });
});
