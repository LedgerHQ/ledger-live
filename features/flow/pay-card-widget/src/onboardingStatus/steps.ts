/**
 * The steps of card onboarding, in the order they are listed.
 *
 * Ids and order only. The copy belongs to whatever renders the steps, which translates it and
 * picks each icon; the id is the contract between the two.
 */
const LEADING_STEPS = ["create-account", "choose-card-type", "top-up-card"] as const;

/** The steps desktop lists. */
export const CARD_ONBOARDING_STEPS = [...LEADING_STEPS, "first-purchase"] as const;

/** The steps mobile lists: the phone can carry the card, so one more sits before the purchase. */
export const CARD_ONBOARDING_STEPS_WITH_WALLET = [
  ...LEADING_STEPS,
  "apple-google-pay",
  "first-purchase",
] as const;

/** Every onboarding step id, on any platform. */
export type CardOnboardingStepId = (typeof CARD_ONBOARDING_STEPS_WITH_WALLET)[number];

/** The steps the Card endpoints answer for: every step but the phone wallet one. */
export type CardOnboardingProviderStepId = (typeof CARD_ONBOARDING_STEPS)[number];
