import type { Card as BrazeCard } from "@braze/web-sdk";

import { ContentCardsType, LocationContentCard } from "~/types/dynamicContent";
import { mapSmallSquareContentCard } from "../mapSmallSquareContentCard";

const brazeChildCard = (overrides: Record<string, string> = {}, id = "child-1"): BrazeCard =>
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  ({
    id,
    created: new Date("2026-01-02"),
    extras: {
      type: ContentCardsType.smallSquare,
      categoryId: "alwayson",
      title: "Ledger Stax",
      media: "https://example.com/stax.png",
      link: "https://shop.ledger.com/stax",
      order: "1",
      ...overrides,
    },
  }) as unknown as BrazeCard;

describe("mapSmallSquareContentCard", () => {
  it("should map a small_square Braze card to UI props", () => {
    const mapped = mapSmallSquareContentCard(brazeChildCard(), LocationContentCard.Portfolio);

    expect(mapped).toEqual({
      id: "child-1",
      title: "Ledger Stax",
      subDescription: undefined,
      tag: undefined,
      media: "https://example.com/stax.png",
      mediaType: undefined,
      filledMedia: false,
      link: "https://shop.ledger.com/stax",
      location: LocationContentCard.Portfolio,
      order: 1,
      created: new Date("2026-01-02"),
      extras: expect.objectContaining({
        type: ContentCardsType.smallSquare,
        categoryId: "alwayson",
      }),
    });
  });

  it("should return null when the card is not a small_square type", () => {
    const mapped = mapSmallSquareContentCard(
      brazeChildCard({ type: ContentCardsType.action }),
      LocationContentCard.Portfolio,
    );

    expect(mapped).toBeNull();
  });

  it.each([
    ["true", true],
    ["1", true],
    ["false", false],
    ["0", false],
  ])("should map filledMedia value %s to %s", (filledMedia, expected) => {
    const mapped = mapSmallSquareContentCard(brazeChildCard({ filledMedia }));

    expect(mapped?.filledMedia).toBe(expected);
  });
});
