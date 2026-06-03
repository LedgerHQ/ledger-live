import BigNumber from "bignumber.js";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { renderHook, withFlagOverrides } from "tests/testSetup";
import { usePostOnboardingEntryPointVisibleOnWallet } from "@ledgerhq/live-common/postOnboarding/hooks/usePostOnboardingEntryPointVisibleOnWallet";
import { useLNSUpsellBannerState } from "LLD/features/LNSUpsell";
import { BTC_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import useActionCards from "~/renderer/hooks/useActionCards";
import { useBannersVisibility } from "../useBannersVisibility";
import { ActionContentCard, LocationContentCard } from "~/types/dynamicContent";

jest.mock("@ledgerhq/live-common/postOnboarding/hooks/usePostOnboardingEntryPointVisibleOnWallet", () => ({
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

const basePostOnboarding = {
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: null,
  actionsToComplete: [] as never[],
  actionsCompleted: {},
  lastActionCompleted: null,
  postOnboardingInProgress: false,
};

const wallet40WithFinishWidget = withFlagOverrides({
  lldActionCarousel: { enabled: false },
  onboardingWidget: { enabled: true },
});

const defaultInitialState = {
  ...wallet40WithFinishWidget,
  settings: {
    showClearCacheBanner: false,
  },
  dynamicContent: {
    portfolioCards: [],
    bottomPortfolioCards: [],
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
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
    expect(result.current.shouldDisplayFinishOnboardingWidget).toBe(true);
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
        },
      },
    });

    expect(result.current.isClearCacheBannerVisible).toBe(true);
    expect(result.current.isPostOnboardingBannerVisible).toBe(false);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
    expect(result.current.hasAnyContentBannerVisible).toBe(false);
  });

  it("should return true for isFinishOnboardingWidgetVisible when post-onboarding is visible and flag is on", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: defaultInitialState,
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(true);
    expect(result.current.shouldDisplayFinishOnboardingWidget).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should hide finish onboarding widget when onboardingWidget flag is off", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        ...withFlagOverrides({
          lldActionCarousel: { enabled: false },
          onboardingWidget: { enabled: false },
        }),
      },
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
    expect(result.current.shouldDisplayFinishOnboardingWidget).toBe(false);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should hide finish onboarding widget for Ledger Nano S", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        postOnboarding: {
          ...basePostOnboarding,
          deviceModelId: DeviceModelId.nanoS,
          walletEntryPointEligibleForPortfolio: true,
        },
      },
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should hide finish onboarding widget when portfolio eligibility is persisted as false", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        postOnboarding: {
          ...basePostOnboarding,
          deviceModelId: DeviceModelId.stax,
          walletEntryPointEligibleForPortfolio: false,
        },
      },
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should hide finish onboarding widget when user has accounts with funds (eligibility not yet persisted)", () => {
    mockUsePostOnboardingEntryPointVisibleOnWallet.mockReturnValue(true);

    const accountWithFunds = {
      ...BTC_ACCOUNT,
      balance: new BigNumber(1000),
    };

    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        accounts: [accountWithFunds],
        postOnboarding: {
          ...basePostOnboarding,
          deviceModelId: DeviceModelId.stax,
          walletEntryPointEligibleForPortfolio: null,
        },
      },
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
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
        ...withFlagOverrides({ lldActionCarousel: { enabled: true } }),
      },
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(false);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
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

    expect(result.current.isPostOnboardingBannerVisible).toBe(false);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
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

    expect(result.current.isPostOnboardingBannerVisible).toBe(false);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
    expect(result.current.isLNSUpsellBannerVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });

  it("should return true for isPortfolioContentCardsVisible when portfolio cards exist", () => {
    const { result } = renderHook(() => useBannersVisibility(), {
      initialState: {
        ...defaultInitialState,
        dynamicContent: {
          ...defaultInitialState.dynamicContent,
          portfolioCards: [
            { id: "card-1", title: "Test", location: LocationContentCard.Portfolio },
          ],
        },
      },
    });

    expect(result.current.isPostOnboardingBannerVisible).toBe(false);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(false);
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
        },
      },
    });

    expect(result.current.isClearCacheBannerVisible).toBe(true);
    expect(result.current.isPostOnboardingBannerVisible).toBe(true);
    expect(result.current.isFinishOnboardingWidgetVisible).toBe(true);
    expect(result.current.isLNSUpsellBannerVisible).toBe(true);
    expect(result.current.hasAnyContentBannerVisible).toBe(true);
  });
});
