import { customWrapper } from "@ledgerhq/wallet-api-server";
import { z } from "zod";
import type { PredictionsBindingAnswer } from "./binding";
import {
  PREDICTIONS_ORDER_REJECTION_REASONS,
  type PredictionsOrderAction,
  type PredictionsOrderAnswer,
  type PredictionsOrderOutcome,
} from "./order";
import { placeOrderTypedDataJsonSchema } from "./placeOrderTypedData";
import type { PredictionsTypedData } from "./typedData";
import { PREDICTIONS_SETUP_FAILURE_REASONS, type PredictionsSetupOutcome } from "./setup";
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
  /**
   * `accountId` is a Wallet API account id. Rejects with `UserRefusedOnDevice` when the prompt
   * closes unsigned. Once signed, the trading wallet setup shows until `binding.reportSetup`.
   */
  "binding.sign": (accountId: string) => Promise<PredictionsBindingAnswer>;
  /** Resolves once the user closes the setup, or right away when none is open. */
  "binding.reportSetup": (setup: PredictionsSetupOutcome) => Promise<void>;
  /**
   * Signs a checked place order authorization with the account. Rejects with `UserRefusedOnDevice`
   * when the prompt closes unsigned. Once signed, the order shows as placing until `order.report`.
   */
  "order.sign": (
    accountId: string,
    typedData: PredictionsTypedData,
  ) => Promise<PredictionsOrderAnswer>;
  /**
   * Resolves with the user's pick once they close or retry, or `close` right away when `orderId`
   * isn't the open order, e.g. one that timed out or that a newer order replaced.
   */
  "order.report": (
    orderId: string,
    outcome: PredictionsOrderOutcome,
  ) => Promise<PredictionsOrderAction>;
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

const bindAccountSchema = z.strictObject({ accountId: z.string().min(1) });

const reportSetupSchema = z.discriminatedUnion("outcome", [
  z.strictObject({ outcome: z.literal("created") }),
  z.strictObject({ outcome: z.literal("found") }),
  z.strictObject({
    outcome: z.literal("failed"),
    reason: z.enum(PREDICTIONS_SETUP_FAILURE_REASONS),
  }),
]) satisfies z.ZodType<PredictionsSetupOutcome>;

const signOrderSchema = z.strictObject({
  accountId: z.string().min(1),
  typedData: placeOrderTypedDataJsonSchema,
});

const orderId = z.string().min(1);

const reportOrderSchema = z.union([
  z.strictObject({
    orderId,
    outcome: z.literal("filled"),
    shares: z.number().positive(),
    price: z.number().positive(),
  }),
  z.strictObject({ orderId, outcome: z.literal("filled") }),
  z.strictObject({ orderId, outcome: z.literal("not-filled") }),
  z.strictObject({
    orderId,
    outcome: z.literal("rejected"),
    reason: z.enum(PREDICTIONS_ORDER_REJECTION_REASONS),
  }),
  z.strictObject({ orderId, outcome: z.literal("unconfirmed") }),
]) satisfies z.ZodType<PredictionsOrderOutcome & { orderId: string }>;

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
  "custom.predictions.bindAccount": customWrapper<
    z.input<typeof bindAccountSchema>,
    PredictionsBindingAnswer
  >(async rawParams => {
    const { accountId } = bindAccountSchema.parse(rawParams);
    return uiHooks["binding.sign"](accountId);
  }),
  "custom.predictions.reportSetup": customWrapper<
    z.input<typeof reportSetupSchema>,
    Record<string, never>
  >(async rawParams => {
    await uiHooks["binding.reportSetup"](reportSetupSchema.parse(rawParams));
    return {};
  }),
  "custom.predictions.signOrder": customWrapper<
    z.input<typeof signOrderSchema>,
    PredictionsOrderAnswer
  >(async rawParams => {
    const { accountId, typedData } = signOrderSchema.parse(rawParams);
    return uiHooks["order.sign"](accountId, typedData);
  }),
  "custom.predictions.reportOrder": customWrapper<
    z.input<typeof reportOrderSchema>,
    { action: PredictionsOrderAction }
  >(async rawParams => {
    const { orderId, ...outcome } = reportOrderSchema.parse(rawParams);
    return { action: await uiHooks["order.report"](orderId, outcome) };
  }),
  "custom.predictions.close": customWrapper<Record<string, never>, Record<string, never>>(
    async () => {
      uiHooks["sheet.close"]();
      uiHooks["app.close"]();
      return {};
    },
  ),
});
