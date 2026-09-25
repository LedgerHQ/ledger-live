import { isPayCardAccountRead } from "./isPayCardAccountRead";

const ready = {
  isSignedIn: true,
  isCardStatusUninitialized: false,
  isCardStatusFetching: false,
  cardStatus: { id: "card-1" },
  cardStatusError: undefined,
  transactions: [],
  onboardingStatus: {},
} as const;

describe("isPayCardAccountRead", () => {
  it("is true once a card and its dependent queries have resolved", () => {
    expect(isPayCardAccountRead(ready)).toBe(true);
  });

  it("is true for the documented no-card 404 without waiting on other queries", () => {
    expect(
      isPayCardAccountRead({
        ...ready,
        cardStatus: undefined,
        cardStatusError: { status: 404 },
        transactions: undefined,
        onboardingStatus: undefined,
      }),
    ).toBe(true);
  });

  it("is false while card-status is still in flight", () => {
    expect(isPayCardAccountRead({ ...ready, isCardStatusFetching: true })).toBe(false);
  });

  it("is false on a transient card-status failure so a later success can still be a first read", () => {
    expect(
      isPayCardAccountRead({
        ...ready,
        cardStatus: undefined,
        cardStatusError: { status: 500 },
      }),
    ).toBe(false);
  });

  it("is false until transactions and onboarding have been read for a known card", () => {
    expect(isPayCardAccountRead({ ...ready, transactions: undefined })).toBe(false);
    expect(isPayCardAccountRead({ ...ready, onboardingStatus: undefined })).toBe(false);
  });
});
