import { act } from "tests/testSetup";
import { openURL } from "~/renderer/linking";
import { closeGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { appStartFeatureIntroCard, carouselCampaignCard } from "../../__tests__/fixtures";
import useGenericAwarenessModalFeatureIntroViewModel from "../useGenericAwarenessModalFeatureIntroViewModel";
import { renderHookWithStore } from "../testHelpers/renderHookWithStore";

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
      useGenericAwarenessModalFeatureIntroViewModel(undefined),
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
    });
  });

  it("should return empty content when content card is not feature intro", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(carouselCampaignCard),
    );

    expect(result.current.title).toBe("");
    expect(result.current.items).toEqual([]);
  });

  it("should map feature intro content from the content card", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(appStartFeatureIntroCard),
    );

    expect(result.current.title).toBe("Connect a Ledger device");
    expect(result.current.subtitle).toBe(
      "Go beyond exchanges and software wallets. Pair a signer to unlock the full Ledger Wallet experience.",
    );
    expect(result.current.primaryButtonLabel).toBe("Got it");
    expect(result.current.secondaryButtonLabel).toBe("Compare signers");
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]).toEqual({
      title: "Buy, swap, and stake",
      subtitle: "Build your portfolio with the simplicity of exchanges and security of a signer.",
      icon: "HandCoins",
    });
  });

  it("should fall back to Gift icon when icon name is invalid", () => {
    const cardWithInvalidIcon = {
      ...appStartFeatureIntroCard,
      items: [{ icon: "NotARealIcon", title: "Item", subtitle: "Description" }],
    };

    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(cardWithInvalidIcon),
    );

    expect(result.current.items[0]?.icon).toBe("Gift");
  });

  it("should open primary link and close dialog on primary click", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(appStartFeatureIntroCard),
    );

    act(() => {
      result.current.onPrimaryClick();
    });

    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });

  it("should open secondary link and close dialog on secondary click", () => {
    const { result } = renderHookWithStore(() =>
      useGenericAwarenessModalFeatureIntroViewModel(appStartFeatureIntroCard),
    );

    act(() => {
      result.current.onSecondaryClick();
    });

    expect(openURL).toHaveBeenCalledWith("https://www.ledger.com/compare-ledger-signers");
    expect(jest.mocked(closeGenericAwarenessModalDialog)).toHaveBeenCalled();
  });
});
