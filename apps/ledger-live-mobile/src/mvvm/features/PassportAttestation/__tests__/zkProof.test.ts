import { generateAgeProof, verifyAgeProof, setZkBridge } from "../utils/zkProof";

const MOCK_GROTH16_PROOF = {
  pi_a: ["12345678901234567890", "98765432109876543210", "1"],
  pi_b: [
    ["1111", "2222"],
    ["3333", "4444"],
    ["1", "0"],
  ],
  pi_c: ["5555", "6666", "1"],
  protocol: "groth16",
  curve: "bn128",
};

const mockBridge = {
  generateProof: jest.fn().mockResolvedValue({
    proof: MOCK_GROTH16_PROOF,
    publicSignals: ["20260404", "18"],
  }),
  verifyProof: jest.fn().mockResolvedValue(true),
};

describe("zkProof", () => {
  const DOB = 19900101;
  const CURRENT_DATE = 20260404;
  const MRZ_HASH = "abcd1234";
  const MIN_AGE = 18;

  beforeEach(() => {
    setZkBridge(mockBridge);
    jest.clearAllMocks();
  });

  afterEach(() => {
    setZkBridge(null);
  });

  describe("generateAgeProof", () => {
    it("should return an AgeProof with required fields", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof.proof).toBeTruthy();
      expect(proof.publicSignals).toBeInstanceOf(Array);
      expect(proof.minimumAge).toBe(MIN_AGE);
      expect(proof.verifiedAt).toBeTruthy();
      expect(proof.proofHash).toBeTruthy();
    });

    it("should include publicSignals from the circuit", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof.publicSignals[0]).toBe("20260404");
      expect(proof.publicSignals[1]).toBe("18");
    });

    it("should produce a Groth16 formatted proof", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);
      const parsed = JSON.parse(proof.proof);

      expect(parsed.protocol).toBe("groth16");
      expect(parsed.pi_a).toBeDefined();
      expect(parsed.pi_b).toBeDefined();
      expect(parsed.pi_c).toBeDefined();
    });

    it("should derive proofHash from pi_a", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof.proofHash).toBe("1234567890123456");
    });

    it("should call bridge with correct circuit inputs", async () => {
      await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(mockBridge.generateProof).toHaveBeenCalledWith({
        dateOfBirth: DOB,
        currentDate: CURRENT_DATE,
        minimumAge: MIN_AGE,
      });
    });

    it("should throw if bridge is not set", async () => {
      setZkBridge(null);

      await expect(generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE)).rejects.toThrow(
        "ZK bridge not initialized",
      );
    });
  });

  describe("verifyAgeProof", () => {
    it("should verify a Groth16 proof via bridge", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);
      const valid = await verifyAgeProof(proof);

      expect(valid).toBe(true);
      expect(mockBridge.verifyProof).toHaveBeenCalled();
    });

    it("should accept legacy commitment-v1 proofs without bridge", async () => {
      setZkBridge(null);

      const legacyProof = {
        proof: JSON.stringify({
          protocol: "commitment-v1",
          commitment: "abc123def456",
          nullifier: "xyz789",
        }),
        publicSignals: ["20260404", "18", "abc123def456"],
        minimumAge: 18,
        verifiedAt: new Date().toISOString(),
        proofHash: "abc123de",
      };

      expect(await verifyAgeProof(legacyProof)).toBe(true);
    });

    it("should return false for an empty proof", async () => {
      const invalid = {
        proof: "",
        publicSignals: [],
        minimumAge: 18,
        verifiedAt: new Date().toISOString(),
        proofHash: "abc",
      };

      expect(await verifyAgeProof(invalid)).toBe(false);
    });

    it("should return false for invalid JSON", async () => {
      const invalid = {
        proof: "not-json",
        publicSignals: ["1", "2"],
        minimumAge: 18,
        verifiedAt: new Date().toISOString(),
        proofHash: "abc",
      };

      expect(await verifyAgeProof(invalid)).toBe(false);
    });

    it("should structurally accept Groth16 proof when bridge is unavailable", async () => {
      setZkBridge(null);

      const groth16Proof = {
        proof: JSON.stringify(MOCK_GROTH16_PROOF),
        publicSignals: ["20260404", "18"],
        minimumAge: 18,
        verifiedAt: new Date().toISOString(),
        proofHash: "1234567890123456",
      };

      expect(await verifyAgeProof(groth16Proof)).toBe(true);
    });
  });
});
