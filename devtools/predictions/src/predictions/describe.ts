import type {
  PredictionsLinkedAddress,
  PredictionsOnboardingState,
  PredictionsReset,
  PredictionsSetupPreview,
} from "../types";

export const RESETS: readonly {
  what: PredictionsReset;
  label: string;
  done: string;
  isAvailable: (state: PredictionsOnboardingState) => boolean;
}[] = [
  {
    what: "binding",
    label: "Unbind the active account",
    done: "it asks to sign the binding again, without the account picker.",
    isAvailable: ({ addresses }) => addresses.some(({ isActive, isBound }) => isActive && isBound),
  },
  {
    what: "accounts",
    label: "Forget the accounts",
    done: "the account picker and the binding come back.",
    isAvailable: ({ addresses }) => addresses.length > 0,
  },
  {
    what: "documents",
    label: "Forget the accepted documents",
    done: "the onboarding sheet comes back, without the intro.",
    isAvailable: ({ acceptedVersions }) => Object.keys(acceptedVersions).length > 0,
  },
  {
    what: "everything",
    label: "Forget everything",
    done: "it starts over, as on the first open.",
    isAvailable: ({ raw }) => raw !== undefined,
  },
];

export function describeVersions(acceptedVersions: Readonly<Record<string, string>>): string {
  const versions = Object.entries(acceptedVersions);
  if (versions.length === 0) return "none accepted";
  return versions.map(([document, version]) => `${document} v${version}`).join(", ");
}

export function describeAddress({ address, isActive, isBound }: PredictionsLinkedAddress): string {
  return [address, isActive ? "active" : null, isBound ? "bound" : "not bound"]
    .filter(Boolean)
    .join(" · ");
}

export function setupPreviews(
  failureReasons: readonly string[],
): readonly { label: string; preview?: PredictionsSetupPreview }[] {
  return [
    { label: "Loading" },
    { label: "Created", preview: { outcome: "created" } },
    { label: "Found", preview: { outcome: "found" } },
    ...failureReasons.map(reason => ({
      label: `Failed: ${reason}`,
      preview: { outcome: "failed" as const, reason },
    })),
  ];
}
