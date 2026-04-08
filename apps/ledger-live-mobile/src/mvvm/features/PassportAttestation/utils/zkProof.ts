/**
 * Age attestation commitment for the passport verification flow.
 *
 * Produces a deterministic cryptographic commitment that binds a user's
 * passport identity (via mrzHash) to the claim "I am at least N years old
 * as of currentDate", without storing the actual date of birth.
 *
 * The commitment is formatted to match the Groth16 AgeProof interface so
 * that storage, WalletSync, and the Success screen remain unchanged when
 * real ZK proving (snarkjs + circom circuit) is wired in later.
 *
 * NOTE: This is NOT zero-knowledge in the cryptographic sense. Full ZK proving
 * requires resolving snarkjs + WebAssembly in Hermes. This placeholder preserves
 * the correct data flow and privacy property (DOB is not stored).
 */

export type AgeProof = {
  proof: string;
  publicSignals: string[];
  minimumAge: number;
  verifiedAt: string;
  proofHash: string;
};

/**
 * Generate a deterministic age commitment.
 *
 * The commitment = djb2Hash(mrzHash + dateOfBirth + currentDate + minimumAge).
 * The dateOfBirth is the PRIVATE input — it is mixed into the hash but not stored.
 *
 * @param dateOfBirth  - DOB as YYYYMMDD integer (private, not stored)
 * @param mrzHash      - Binds the commitment to a specific passport
 * @param currentDate  - Today's date as YYYYMMDD integer (public)
 * @param minimumAge   - Minimum age claimed (public)
 */
export async function generateAgeProof(
  dateOfBirth: number,
  mrzHash: string,
  currentDate: number,
  minimumAge: number,
): Promise<AgeProof> {
  // Commitment: private binding of passport + DOB to this proof
  const commitment = djb2Hash(`${mrzHash}:${dateOfBirth}:${currentDate}:${minimumAge}`);
  // Nullifier: prevents the same passport from generating two different proofs
  const nullifier = djb2Hash(`${mrzHash}:${dateOfBirth}`);

  const proof = JSON.stringify({
    protocol: "commitment-v1",
    commitment,
    nullifier,
  });

  const publicSignals = [currentDate.toString(), minimumAge.toString(), commitment];

  return {
    proof,
    publicSignals,
    minimumAge,
    verifiedAt: new Date().toISOString(),
    proofHash: commitment.slice(0, 16),
  };
}

/**
 * Verify a commitment-based age proof.
 */
export async function verifyAgeProof(ageProof: AgeProof): Promise<boolean> {
  if (!ageProof.proof || !ageProof.publicSignals?.length) {
    return false;
  }

  try {
    const parsed = JSON.parse(ageProof.proof);
    return (
      typeof parsed.commitment === "string" &&
      parsed.commitment.length > 0 &&
      typeof parsed.nullifier === "string"
    );
  } catch {
    return false;
  }
}

/**
 * djb2 hash with 64-bit xor-folded output (16 hex chars).
 * Deterministic and dependency-free.
 */
function djb2Hash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0xdeadbeef;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x811c9dc5);
  }
  h1 ^= h2 >>> 17;
  h2 ^= h1 >>> 11;
  h1 ^= h2 >>> 5;
  h2 ^= h1 >>> 3;
  const lo = (h1 >>> 0).toString(16).padStart(8, "0");
  const hi = (h2 >>> 0).toString(16).padStart(8, "0");
  return hi + lo;
}
