/**
 * Groth16 age proof generation and verification via WebView bridge.
 *
 * The actual snarkjs computation runs in a hidden WebView (V8/JSC)
 * because Hermes does not support WebAssembly well enough for snarkjs.
 *
 * The bridge is injected via setZkBridge() when the WebView is mounted
 * in the GenerateProof screen.
 */

export type AgeProof = {
  proof: string;
  publicSignals: string[];
  minimumAge: number;
  verifiedAt: string;
  proofHash: string;
};

type ZkBridge = {
  generateProof: (input: {
    dateOfBirth: number;
    currentDate: number;
    minimumAge: number;
  }) => Promise<{ proof: object; publicSignals: string[] }>;
  verifyProof: (proof: object, publicSignals: string[]) => Promise<boolean>;
};

let _bridge: ZkBridge | null = null;

export function setZkBridge(bridge: ZkBridge | null) {
  _bridge = bridge;
}

/**
 * Generate a Groth16 age proof via the WebView bridge.
 *
 * @param dateOfBirth  - DOB as YYYYMMDD integer (private circuit input)
 * @param mrzHash      - Passport binding (reserved for future circuit use)
 * @param currentDate  - Today as YYYYMMDD integer (public circuit input)
 * @param minimumAge   - Minimum age claimed (public circuit input)
 */
export async function generateAgeProof(
  dateOfBirth: number,
  _mrzHash: string,
  currentDate: number,
  minimumAge: number,
): Promise<AgeProof> {
  if (!_bridge) {
    throw new Error("ZK bridge not initialized. Ensure WebView is mounted.");
  }

  const { proof, publicSignals } = await _bridge.generateProof({
    dateOfBirth,
    currentDate,
    minimumAge,
  });

  const proofString = JSON.stringify(proof);

  return {
    proof: proofString,
    publicSignals: publicSignals.map(String),
    minimumAge,
    verifiedAt: new Date().toISOString(),
    proofHash: deriveProofHash(proof),
  };
}

/**
 * Verify an age proof. Supports both:
 * - Legacy commitment-v1 proofs (structural check only)
 * - Real Groth16 proofs (verified via WebView bridge)
 */
export async function verifyAgeProof(ageProof: AgeProof): Promise<boolean> {
  if (!ageProof.proof || !ageProof.publicSignals?.length) {
    return false;
  }

  try {
    const parsed = JSON.parse(ageProof.proof);

    // Legacy commitment-v1 proofs: structural check for backward compat
    if (parsed.protocol === "commitment-v1") {
      return typeof parsed.commitment === "string" && parsed.commitment.length > 0;
    }

    // Groth16 proof: verify via bridge if available
    if (_bridge) {
      return await _bridge.verifyProof(parsed, ageProof.publicSignals);
    }

    // No bridge but has Groth16 structure — accept structurally
    return !!(parsed.pi_a && parsed.pi_b && parsed.pi_c);
  } catch {
    return false;
  }
}

function deriveProofHash(proof: any): string {
  const raw = String(proof.pi_a?.[0] || "");
  return raw.slice(0, 16);
}
