import { appStartFeatureIntroCard, carouselCampaignCard } from "../../testUtils/fixtures";
import useGenericAwarenessModalFeatureIntroViewModel from "../useGenericAwarenessModalFeatureIntroViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

describe("useGenericAwarenessModalFeatureIntroViewModel", () => {
  it("should return empty content when content card is undefined", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(undefined, false),
    );

    expect(result.current).toEqual({
      title: "",
      subtitle: "",
      items: [],
      primaryButtonLabel: "",
      secondaryButtonLabel: "",
      imageUrl: undefined,
      onPrimaryClick: expect.any(Function),
      onSecondaryClick: expect.any(Function),
      onHeaderClose: expect.any(Function),
      onDismiss: expect.any(Function),
    });
  });

  it("should return empty content when content card is not feature intro", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(carouselCampaignCard, false),
    );

    expect(result.current.title).toBe("");
    expect(result.current.items).toEqual([]);
  });

  it("should map feature intro content from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(appStartFeatureIntroCard, true),
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
      useGenericAwarenessModalFeatureIntroViewModel(cardWithInvalidIcon, true),
    );

    expect(result.current.items[0]?.icon).toBe("LedgerLogo");
  });
});
