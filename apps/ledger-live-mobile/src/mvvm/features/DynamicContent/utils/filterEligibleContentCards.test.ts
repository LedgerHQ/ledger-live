import { filterEligibleContentCards } from "./filterEligibleContentCards";

const context = { hasFunds: true, isOnboarded: true, hasStax: false };

describe("filterEligibleContentCards", () => {
  it("should keep cards that have no required states", () => {
    const cards = [{ id: "always", extras: { location: "wallet" } }];

    expect(filterEligibleContentCards(cards, context)).toEqual({
      eligibleCards: cards,
      evaluations: [{ id: "always", requiredStates: [], result: { eligible: true } }],
    });
  });

  it("should drop cards whose required states are not met", () => {
    const cards = [
      { id: "ok", extras: { requiredStates: "hasFunds" } },
      { id: "blocked", extras: { requiredStates: "hasStax" } },
    ];

    const { eligibleCards, evaluations } = filterEligibleContentCards(cards, context);

    expect(eligibleCards).toEqual([cards[0]]);
    expect(evaluations).toEqual([
      { id: "ok", requiredStates: ["hasFunds"], result: { eligible: true } },
      {
        id: "blocked",
        requiredStates: ["hasStax"],
        result: { eligible: false, blockedBy: "hasStax", reason: "unmet-state" },
      },
    ]);
  });
});
