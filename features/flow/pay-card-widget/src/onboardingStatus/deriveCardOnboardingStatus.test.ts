import {
  deriveCardOnboardingStatus,
  hasPositiveBalance,
  type CardOnboardingSignals,
} from "./deriveCardOnboardingStatus";
import {
  CARD_ONBOARDING_STEPS,
  CARD_ONBOARDING_STEPS_WITH_WALLET,
  type CardOnboardingProviderStepId,
} from "./steps";

const NOTHING_DONE: CardOnboardingSignals<CardOnboardingProviderStepId> = {
  "create-account": false,
  "choose-card-type": false,
  "top-up-card": false,
  "first-purchase": false,
};

const NOTHING_DONE_WITH_WALLET: CardOnboardingSignals = {
  ...NOTHING_DONE,
  "apple-google-pay": false,
};

describe("deriveCardOnboardingStatus", () => {
  it("lists the steps in the order the dialog walks them", () => {
    const { steps } = deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS, NOTHING_DONE);

    expect(steps.map(({ id }) => id)).toEqual([
      "create-account",
      "choose-card-type",
      "top-up-card",
      "first-purchase",
    ]);
  });

  it("puts the phone wallet step before the purchase, for the platform that lists it", () => {
    const { steps } = deriveCardOnboardingStatus(
      CARD_ONBOARDING_STEPS_WITH_WALLET,
      NOTHING_DONE_WITH_WALLET,
    );

    expect(steps.map(({ id }) => id)).toEqual([
      "create-account",
      "choose-card-type",
      "top-up-card",
      "apple-google-pay",
      "first-purchase",
    ]);
  });

  it("counts what is done, so no consumer has to", () => {
    const { completedCount } = deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS, {
      ...NOTHING_DONE,
      "create-account": true,
      "choose-card-type": true,
    });

    expect(completedCount).toBe(2);
  });

  it("counts the steps it was given, so a platform step counts like any other", () => {
    const { completedCount } = deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS_WITH_WALLET, {
      ...NOTHING_DONE_WITH_WALLET,
      "apple-google-pay": true,
    });

    expect(completedCount).toBe(1);
  });

  it("counts nothing when nothing is answered yet", () => {
    expect(deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS, NOTHING_DONE).completedCount).toBe(0);
  });

  it("marks each step from its own answer, not from the ones before it", () => {
    // A holder can hold a funded wallet without having ordered a card.
    const { steps } = deriveCardOnboardingStatus(CARD_ONBOARDING_STEPS, {
      ...NOTHING_DONE,
      "top-up-card": true,
    });

    expect(steps.map(({ isDone }) => isDone)).toEqual([false, false, true, false]);
  });
});

describe("hasPositiveBalance", () => {
  it.each([
    ["125.40", true],
    ["0.01", true],
    ["0", false],
    ["0.00", false],
    // Unread, which is not the same as empty.
    [null, false],
  ])("reads %s as %s", (balance, expected) => {
    expect(hasPositiveBalance(balance)).toBe(expected);
  });

  it("does not read a balance it cannot parse as money", () => {
    expect(hasPositiveBalance("not-a-number")).toBe(false);
  });
});
