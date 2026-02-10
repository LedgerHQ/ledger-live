import { renderHook } from "tests/testSetup";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell";
import useActionCards from "~/renderer/hooks/useActionCards";
import { useBannersVisibility } from "../useBannersVisibility";
import { ActionContentCard } from "~/types/dynamicContent";
import { LocationContentCard } from "~/types/dynamicContent";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/index", () => ({
  ...jest.requireActual("@ledgerhq/live-common/postOnboarding/hooks/index"),
  usePostOnboardingEntryPointVisibleOnWallet: jest.fn(),
}));
jest.mock("LLD/features/LNSUpsell", () => ({
  ...jest.requireActual("LLD/features/LNSUpsell"),
  useLNSUpsellBannerState: jest.fn(),
}));
jest.mock("~/renderer/hooks/useActionCards", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUsePostOnboardingEntryPointVisibleOnWallet = jest.mocked(
  usePostOnboardingEntryPointVisibleOnWallet,
);
const mockUseLNSUpsellBannerState = jest.mocked(useLNSUpsellBannerState);
const mockUseActionCards = jest.mocked(useActionCards);

const createMockActionCard = (overrides: Partial<ActionContentCard> = {}): ActionContentCard => ({
  id: "card-1",
  title: "Test Card",
  description: "Test description",
  location: LocationContentCard.Action,
  created: null,
  ...overrides,
});

const defaultInitialState = {
  settings: {
    showClearCacheBanner: false,
    overriddenFeatureFlags: {
      lldActionCarousel: { enabled: false },
    },
  },
  dynamicContent: {
    portfolioCards: [],
  },
};

describe("useBannersVisibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(false);
    mockUseLNSUpsellBannerState.mockReturnValue({
      isShown: false,
      params: undefined,
      tracking: "opted_out",
    });
    mockUseActionCards.mockReturnValue({
      actionCards: [],
      onClick: jest.fn(),
      onDismiss: jest.fn(),
    });
  });

  it("should return all banners hidden when no conditions are met", () => {
    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isClearCacheBannerVisible).toBe(false);
    expect(result.current.isPostOnboardingBannerVisible).toBe(false);
    expect(result.current.isActionCardsVisible).toBe(false);
    expect(result.current.isLNSUpsellBannerVisible).toBe(false);
    expect(result.current.isPortfolioContentCardsVisible).toBe(false);
    expect(result.current.hasAnyContentBannerVisible).toBe(false);
  });

  it("should return true for isClearCacheBannerVisible when showClearCacheBanner is true", () => {
    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        settings: {
          showClearCacheBanner: true,
          overriddenFeatureFlags: {
            lldActionCarousel: { enabled: false },
          },
        },
      },
    });

    expect(result.current.isClearCacheBannerVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(false);
  });

  it("should return true for isPostOnboardingBannerVisible when post-onboarding is visible", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should return true for isActionCardsVisible when action cards campaign is running and feature is enabled", () => {
    mockUseActionCards.mockReturnValue({
      actionCards: [createMockActionCard()],
      onClick: jest.fn(),
      onDismiss: jest.fn(),
    });

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        settings: {
          showClearCacheBanner: false,
          overriddenFeatureFlags: {
            lldActionCarousel: { enabled: true },
          },
        },
      },
    });

    expect(result.current.isActionCardsVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should return false for isActionCardsVisible when action cards exist but feature is disabled", () => {
    mockUseActionCards.mockReturnValue({
      actionCards: [createMockActionCard()],
      onClick: jest.fn(),
      onDismiss: jest.fn(),
    });

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isActionCardsVisible).toBe(false);
    expect(result.current.hasAnyContentBannerVisible).toBe(false);
  });

  it("should return true for isLNSUpsellBannerVisible when LNS upsell banner is shown", () => {
    mockUseLNSUpsellBannerState.mockReturnValue({
      isShown: true,
      params: undefined,
      tracking: "opted_in",
    });

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isLNSUpsellBannerVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should return true for isPortfolioContentCardsVisible when portfolio cards exist", () => {
    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        dynamicContent: {
          portfolioCards: [
            { id: "card-1", title: "Test", location: LocationContentCard.Portfolio },
          ],
        },
      },
    });

    expect(result.current.isPortfolioContentCardsVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should return true for hasAnyContentBannerVisible when multiple banners are visible", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);
    mockUseLNSUpsellBannerState.mockReturnValue({
      isShown: true,
      params: undefined,
      tracking: "opted_in",
    });

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        settings: {
          showClearCacheBanner: true,
          overriddenFeatureFlags: {
            lldActionCarousel: { enabled: false },
          },
        },
      },
    });

    expect(result.current.isClearCacheBannerVisible).toBe(true);
    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isLNSUpsellBannerVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });
});
