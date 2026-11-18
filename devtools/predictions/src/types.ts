export interface PredictionsLinkedAddress {
  readonly address: string;
  readonly isBound: boolean;
  readonly isActive: boolean;
}

export interface PredictionsOnboardingState {
  readonly manifestId: string;
  readonly label: string;
  /** False when nothing is stored, or when the stored value can't be read. */
  readonly isStored: boolean;
  /** Document name to accepted version, e.g. `terms: "1"`. */
  readonly acceptedVersions: Readonly<Record<string, string>>;
  readonly addresses: readonly PredictionsLinkedAddress[];
  readonly raw: string | undefined;
}

/** What to forget in one environment, from the least to the most. */
export type PredictionsReset = "binding" | "accounts" | "documents" | "everything";

export type PredictionsSetupPreview =
  | { readonly outcome: "created" }
  | { readonly outcome: "found" }
  | { readonly outcome: "failed"; readonly reason: string };

export interface PredictionsToolProps {
  readonly hasSeenIntro: boolean;
  readonly setIntroSeen: (isSeen: boolean) => void;
  readonly onboardingStates: readonly PredictionsOnboardingState[];
  readonly refresh: () => Promise<void>;
  readonly reset: (manifestId: string, what: PredictionsReset) => Promise<void>;
  /** Forgets the intro and everything every environment stored. */
  readonly replayWholeOnboarding: () => Promise<void>;
  readonly setupFailureReasons: readonly string[];
  /** Opens Ledger Wallet's setup, as after a binding. Without `preview`, it keeps loading. */
  readonly previewSetup: (preview?: PredictionsSetupPreview) => void;
}
