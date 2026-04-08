/**
 * @module ageAttestation
 *
 * This module synchronizes a zero-knowledge age attestation across Live instances
 * via the WalletSync system. It stores a ZK proof that the user is above a certain
 * age (e.g. 18) without revealing the actual date of birth.
 *
 * The attestation is generated on mobile by scanning a passport via NFC, extracting
 * the date of birth from DG1, and producing a ZK proof. The proof is then synced
 * across all Ledger Live instances through the TrustChain.
 *
 * Uses a replace-all strategy: the latest attestation wins on conflict.
 */
import { WalletSyncDataManager } from "../types";
import { z } from "zod";

const schema = z.object({
  proof: z.string().optional(),
  publicSignals: z.array(z.string()).optional(),
  minimumAge: z.number().optional(),
  verifiedAt: z.string().optional(),
  proofHash: z.string().optional(),
});

type DistantState = z.infer<typeof schema>;

export type AgeAttestationLocalState = {
  verified: boolean;
  proof: string | null;
  publicSignals: string[] | null;
  minimumAge: number | null;
  verifiedAt: string | null;
  proofHash: string | null;
};

const manager: WalletSyncDataManager<
  AgeAttestationLocalState,
  {
    replaceAll: DistantState;
  },
  typeof schema
> = {
  schema,

  diffLocalToDistant(localData, latestState) {
    if (!localData.verified || !localData.proof) {
      return {
        hasChanges: false,
        nextState: latestState || {},
      };
    }

    const nextState: DistantState = {
      proof: localData.proof || undefined,
      publicSignals: localData.publicSignals || undefined,
      minimumAge: localData.minimumAge ?? undefined,
      verifiedAt: localData.verifiedAt || undefined,
      proofHash: localData.proofHash || undefined,
    };
    const hasChanges = !sameDistantState(latestState || {}, nextState);
    return {
      hasChanges,
      nextState,
    };
  },

  async resolveIncrementalUpdate(_ctx, localData, latestState, incomingState) {
    if (!incomingState || !incomingState.proof) {
      return { hasChanges: false };
    }

    const localAsDistant: DistantState = localData.verified
      ? {
          proof: localData.proof || undefined,
          publicSignals: localData.publicSignals || undefined,
          minimumAge: localData.minimumAge ?? undefined,
          verifiedAt: localData.verifiedAt || undefined,
          proofHash: localData.proofHash || undefined,
        }
      : {};

    const hasChanges =
      latestState !== incomingState && !sameDistantState(localAsDistant, incomingState);

    if (!hasChanges) {
      return { hasChanges: false };
    }

    return {
      hasChanges: true,
      update: { replaceAll: incomingState },
    };
  },

  applyUpdate(localData, update) {
    const incoming = update.replaceAll;
    if (!incoming.proof) {
      return localData;
    }
    return {
      verified: true,
      proof: incoming.proof ?? localData.proof,
      publicSignals: incoming.publicSignals ?? localData.publicSignals,
      minimumAge: incoming.minimumAge ?? localData.minimumAge,
      verifiedAt: incoming.verifiedAt ?? localData.verifiedAt,
      proofHash: incoming.proofHash ?? localData.proofHash,
    };
  },
};

function sameDistantState(a: DistantState, b: DistantState): boolean {
  return (
    a.proof === b.proof &&
    a.minimumAge === b.minimumAge &&
    a.verifiedAt === b.verifiedAt &&
    a.proofHash === b.proofHash &&
    JSON.stringify(a.publicSignals) === JSON.stringify(b.publicSignals)
  );
}

export default manager;
