import { Linking } from "react-native";

import { act, renderHook } from "@tests/test-renderer";
import { ContentCardEvent } from "@ledgerhq/live-common/braze/contentCardExtras";
import { ContentCardLocation, WalletContentCard } from "~/dynamicContent/types";
import { useCarouselCardModel } from "./useCarouselCardModel";

const cardProps: WalletContentCard = {
  id: "wallet-card-1",
  location: ContentCardLocation.Wallet,
  link: "https://example.com",
  createdAt: 0,
  viewed: false,
  extras: { location: ContentCardLocation.Wallet, order: "1" },
};

describe("useCarouselCardModel", () => {
  it("includes displayedPosition in click and dismiss tracking", async () => {
    const trackContentCardEvent = jest.fn().mockResolvedValue(undefined);
    const logClickCard = jest.fn();
    const dismissCard = jest.fn();
    const openURLSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useCarouselCardModel({
        cardProps,
        displayedPosition: 2,
        logClickCard,
        dismissCard,
        trackContentCardEvent,
      }),
    );

    await act(async () => {
      await result.current.handlePress();
    });
    act(() => {
      result.current.handleHide();
    });

    expect(trackContentCardEvent).toHaveBeenCalledWith(ContentCardEvent.Clicked, {
      location: ContentCardLocation.Wallet,
      page: ContentCardLocation.Wallet,
      order: 1,
      screen: ContentCardLocation.Wallet,
      campaign: "wallet-card-1",
      displayedPosition: 2,
    });
    expect(trackContentCardEvent).toHaveBeenCalledWith(ContentCardEvent.Dismissed, {
      location: ContentCardLocation.Wallet,
      page: ContentCardLocation.Wallet,
      order: 1,
      screen: ContentCardLocation.Wallet,
      campaign: "wallet-card-1",
      displayedPosition: 2,
    });
    expect(openURLSpy).toHaveBeenCalledWith("https://example.com");
    expect(logClickCard).toHaveBeenCalledWith("wallet-card-1");
    expect(dismissCard).toHaveBeenCalledWith("wallet-card-1");

    openURLSpy.mockRestore();
  });

  it("should ignore displayedPosition from Braze extras", async () => {
    const trackContentCardEvent = jest.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useCarouselCardModel({
        cardProps: {
          ...cardProps,
          extras: { ...cardProps.extras, displayedPosition: "invalid" },
        },
        displayedPosition: 1,
        logClickCard: jest.fn(),
        dismissCard: jest.fn(),
        trackContentCardEvent,
      }),
    );

    await act(async () => {
      await result.current.handlePress();
    });

    expect(trackContentCardEvent).toHaveBeenCalledWith(
      ContentCardEvent.Clicked,
      expect.objectContaining({ displayedPosition: 1 }),
    );
    expect(trackContentCardEvent).toHaveBeenCalledWith(
      ContentCardEvent.Clicked,
      expect.not.objectContaining({ displayedPosition: "invalid" }),
    );
  });
});
