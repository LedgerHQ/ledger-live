import type {
  DisclaimerVersion,
  DisclosureVersion,
  TermsVersion,
} from "@features/platform-predictions";

/** The Terms of Use the terms step links to, per version the user accepts. */
export const TERMS_OF_USE_URLS = {
  "1": "https://support.ledger.com",
} as const satisfies Record<TermsVersion, string>;

/** The risk disclaimer the terms step shows, per version the user accepts. */
export const DISCLAIMER_COPY = {
  "1": {
    body: "predictions.onboarding.terms.body",
    checkbox: "predictions.onboarding.terms.checkbox",
  },
} as const satisfies Record<DisclaimerVersion, { body: string; checkbox: string }>;

/** The delegation disclosure the consent step shows, per version the user accepts. */
export const DISCLOSURE_COPY = {
  "1": {
    bullets: [
      "predictions.onboarding.consent.bullets.dedicatedWallet",
      "predictions.onboarding.consent.bullets.secureSigning",
      "predictions.onboarding.consent.bullets.withdraw",
    ],
    checkbox: "predictions.onboarding.consent.checkbox",
    footer: "predictions.onboarding.consent.footer",
  },
} as const satisfies Record<
  DisclosureVersion,
  { bullets: readonly string[]; checkbox: string; footer: string }
>;
