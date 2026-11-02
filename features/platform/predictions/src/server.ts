import { customWrapper } from "@ledgerhq/wallet-api-server";
import { z } from "zod";
import { UnsupportedOnboardingVersion } from "./errors";

// Strict, so a misspelt document fails instead of silently showing nothing.
const onboardingSchema = z.strictObject({
  intro: z.strictObject({}).optional(),
  terms: z
    .object({
      termsVersion: z.string().min(1),
      disclaimerVersion: z.string().min(1),
    })
    .optional(),
  consent: z
    .object({
      disclosureVersion: z.string().min(1),
    })
    .optional(),
});

/**
 * The document versions Ledger Wallet has the text for. A sheet must show the exact version the
 * user accepts, so any other version is refused before a sheet opens.
 */
const TERMS_VERSIONS = ["1"] as const;
const DISCLAIMER_VERSIONS = ["1"] as const;
const DISCLOSURE_VERSIONS = ["1"] as const;

export type TermsVersion = (typeof TERMS_VERSIONS)[number];
export type DisclaimerVersion = (typeof DISCLAIMER_VERSIONS)[number];
export type DisclosureVersion = (typeof DISCLOSURE_VERSIONS)[number];

export type PredictionsTermsVersions = {
  termsVersion: TermsVersion;
  disclaimerVersion: DisclaimerVersion;
};
export type PredictionsConsentVersion = { disclosureVersion: DisclosureVersion };

type OnboardingDocuments = {
  terms?: PredictionsTermsVersions;
  consent?: PredictionsConsentVersion;
};

/**
 * The versions the user accepted. `isCompleted` is false when the sheet closed before the last
 * step: what was accepted until then is still there, so the live app can resume after it.
 */
export type PredictionsOnboardingAnswer = OnboardingDocuments & { isCompleted: boolean };

/** One screen of the onboarding. Every provider call stays in the live app. */
export type PredictionsOnboardingStep =
  | { type: "intro" }
  | { type: "terms"; versions: PredictionsTermsVersions }
  | { type: "consent"; version: PredictionsConsentVersion };

/** What Ledger Wallet shows: the steps one after the other, in the same sheet. */
export type PredictionsSheet = {
  steps: readonly [PredictionsOnboardingStep, ...PredictionsOnboardingStep[]];
  onStepAccept: (step: PredictionsOnboardingStep) => void;
  onComplete: () => void;
};

export type PredictionsUiHooks = {
  /** Replaces the open sheet, if any. `onCancel` runs when the sheet closes before the last step. */
  "sheet.open": (sheet: PredictionsSheet, onCancel: () => void) => void;
  "sheet.close": () => void;
  "app.close": () => void;
  "intro.isSeen": () => boolean;
  "intro.markSeen": () => void;
};

function toSupportedVersion<T extends string>(
  document: string,
  supported: readonly T[],
  version: string,
): T {
  const match = supported.find(supportedVersion => supportedVersion === version);
  if (match === undefined) {
    throw new UnsupportedOnboardingVersion(
      `Ledger Wallet has no text for ${document} version ${version}`,
    );
  }
  return match;
}

function toRequestedDocuments(params: z.infer<typeof onboardingSchema>): OnboardingDocuments {
  const requested: OnboardingDocuments = {};
  if (params.terms) {
    requested.terms = {
      termsVersion: toSupportedVersion("terms", TERMS_VERSIONS, params.terms.termsVersion),
      disclaimerVersion: toSupportedVersion(
        "disclaimer",
        DISCLAIMER_VERSIONS,
        params.terms.disclaimerVersion,
      ),
    };
  }
  if (params.consent) {
    requested.consent = {
      disclosureVersion: toSupportedVersion(
        "disclosure",
        DISCLOSURE_VERSIONS,
        params.consent.disclosureVersion,
      ),
    };
  }
  return requested;
}

export const handlers = ({ uiHooks }: { uiHooks: PredictionsUiHooks }) => ({
  "custom.predictions.onboard": customWrapper<
    z.input<typeof onboardingSchema>,
    PredictionsOnboardingAnswer
  >(async rawParams => {
    // A ZodError reaches the live app as INVALID_PARAMS.
    const params = onboardingSchema.parse(rawParams);
    const requested = toRequestedDocuments(params);

    const steps: PredictionsOnboardingStep[] = [];
    if (params.intro && !uiHooks["intro.isSeen"]()) steps.push({ type: "intro" });
    if (requested.terms) steps.push({ type: "terms", versions: requested.terms });
    if (requested.consent) steps.push({ type: "consent", version: requested.consent });

    const [firstStep, ...nextSteps] = steps;
    if (!firstStep) return { isCompleted: true };

    return new Promise<PredictionsOnboardingAnswer>(resolve => {
      const accepted: OnboardingDocuments = {};
      uiHooks["sheet.open"](
        {
          steps: [firstStep, ...nextSteps],
          onStepAccept: step => {
            if (step.type === "intro") uiHooks["intro.markSeen"]();
            if (step.type === "terms") accepted.terms = step.versions;
            if (step.type === "consent") accepted.consent = step.version;
          },
          onComplete: () => resolve({ isCompleted: true, ...accepted }),
        },
        () => resolve({ isCompleted: false, ...accepted }),
      );
    });
  }),
  "custom.predictions.close": customWrapper<Record<string, never>, Record<string, never>>(
    async () => {
      uiHooks["sheet.close"]();
      uiHooks["app.close"]();
      return {};
    },
  ),
});
