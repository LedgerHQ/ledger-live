import type { AgeAttestationLocalState } from "../../modules/ageAttestation";

type DistantState = {
  proof?: string;
  publicSignals?: string[];
  minimumAge?: number;
  verifiedAt?: string;
  proofHash?: string;
};

export const emptyState: AgeAttestationLocalState = {
  verified: false,
  proof: null,
  publicSignals: null,
  minimumAge: null,
  verifiedAt: null,
  proofHash: null,
};

export const genState = (index: number): AgeAttestationLocalState => {
  const ages = [18, 21, 25, 16];
  const timestamps = [
    "2025-01-15T10:00:00Z",
    "2025-03-20T14:30:00Z",
    "2025-06-10T08:15:00Z",
    "2025-09-05T16:45:00Z",
  ];
  return {
    verified: true,
    proof: `mock-proof-${index}`,
    publicSignals: [`signal-a-${index}`, `signal-b-${index}`],
    minimumAge: ages[index % ages.length],
    verifiedAt: timestamps[index % timestamps.length],
    proofHash: `mock-hash-${index}`,
  };
};

export const convertLocalToDistantState = (
  localState: AgeAttestationLocalState,
): DistantState => ({
  proof: localState.proof || undefined,
  publicSignals: localState.publicSignals || undefined,
  minimumAge: localState.minimumAge ?? undefined,
  verifiedAt: localState.verifiedAt || undefined,
  proofHash: localState.proofHash || undefined,
});

export const convertDistantToLocalState = (
  distantState: DistantState,
): AgeAttestationLocalState => ({
  verified: !!distantState.proof,
  proof: distantState.proof ?? null,
  publicSignals: distantState.publicSignals ?? null,
  minimumAge: distantState.minimumAge ?? null,
  verifiedAt: distantState.verifiedAt ?? null,
  proofHash: distantState.proofHash ?? null,
});

export const similarLocalState = (
  a: AgeAttestationLocalState,
  b: AgeAttestationLocalState,
): boolean =>
  a.verified === b.verified &&
  a.proof === b.proof &&
  a.minimumAge === b.minimumAge &&
  a.verifiedAt === b.verifiedAt &&
  a.proofHash === b.proofHash &&
  JSON.stringify(a.publicSignals) === JSON.stringify(b.publicSignals);
