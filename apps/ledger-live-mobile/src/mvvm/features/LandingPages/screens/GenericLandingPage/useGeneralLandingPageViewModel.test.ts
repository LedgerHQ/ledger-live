import { act, renderHook } from "@tests/test-renderer";
import { Linking } from "react-native";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { LandingPageUseCase } from "~/dynamicContent/types";
import { useGeneralLandingPage } from "./useGeneralLandingPageViewModel";
import { fakeCategoryContentCards, landingPageStickyCtaCard } from "../../__integrations__/shared";

jest.mock("~/dynamicContent/useDynamicContent", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedUseDynamicContent = jest.mocked(useDynamicContent);

describe("useGeneralLandingPage", () => {
  const logClickCard = jest.fn();
  const trackContentCardEvent = jest.fn();
  const goBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    mockedUseDynamicContent.mockReturnValue({
      categoriesCards: fakeCategoryContentCards,
      getStickyCtaCardByLandingPage: jest.fn(() => landingPageStickyCtaCard),
      logClickCard,
      trackContentCardEvent,
    } as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should wait for tracking before opening the sticky CTA link", async () => {
    let resolveTracking: (() => void) | undefined;
    trackContentCardEvent.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveTracking = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useGeneralLandingPage({
        route: {
          params: { useCase: LandingPageUseCase.LP_Generic },
        },
        navigation: { goBack },
      } as never),
    );

    let openLinkPromise: Promise<void> | undefined;
    act(() => {
      openLinkPromise = result.current.openLink(landingPageStickyCtaCard);
    });

    expect(trackContentCardEvent).toHaveBeenCalledWith("contentcard_clicked", {
      campaign: "stickyCta001",
      cta: "Sign Up Now",
      link: "https://example.com/signup",
      contentcard: "Sign Up Now",
      landingPage: "LP_Generic",
      location: "landing_page_sticky_cta",
    });
    expect(logClickCard).not.toHaveBeenCalled();
    expect(Linking.openURL).not.toHaveBeenCalled();

    await act(async () => {
      resolveTracking?.();
      await openLinkPromise;
    });

    expect(logClickCard).toHaveBeenCalledWith("stickyCta001");
    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com/signup");
  });
});
