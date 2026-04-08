import { generateAgeProof, verifyAgeProof } from "../utils/zkProof";

describe("zkProof", () => {
  const DOB = 19900101;
  const CURRENT_DATE = 20260404;
  const MRZ_HASH = "abcd1234";
  const MIN_AGE = 18;

  describe("generateAgeProof", () => {
    it("should return an AgeProof with required fields", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof.proof).toBeTruthy();
      expect(proof.publicSignals).toBeInstanceOf(Array);
      expect(proof.minimumAge).toBe(MIN_AGE);
      expect(proof.verifiedAt).toBeTruthy();
      expect(proof.proofHash).toBeTruthy();
    });

    it("should include currentDate and minimumAge in public signals", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof.publicSignals[0]).toBe(CURRENT_DATE.toString());
      expect(proof.publicSignals[1]).toBe(MIN_AGE.toString());
    });

    it("should produce a commitment-v1 formatted proof", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);
      const parsed = JSON.parse(proof.proof);

      expect(parsed.protocol).toBe("commitment-v1");
      expect(parsed.commitment).toBeTruthy();
      expect(parsed.nullifier).toBeTruthy();
    });

    it("should produce different proofHash for different passports", async () => {
      const proof1 = await generateAgeProof(DOB, "hash1", CURRENT_DATE, MIN_AGE);
      const proof2 = await generateAgeProof(DOB, "hash2", CURRENT_DATE, MIN_AGE);

      expect(proof1.proofHash).not.toBe(proof2.proofHash);
    });

    it("should produce different proofHash for different DOBs", async () => {
      const proof1 = await generateAgeProof(19900101, MRZ_HASH, CURRENT_DATE, MIN_AGE);
      const proof2 = await generateAgeProof(19900102, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof1.proofHash).not.toBe(proof2.proofHash);
    });

    it("should be deterministic for same inputs", async () => {
      const proof1 = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);
      const proof2 = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);

      expect(proof1.proofHash).toBe(proof2.proofHash);
    });
  });

  describe("verifyAgeProof", () => {
    it("should return true for a valid proof", async () => {
      const proof = await generateAgeProof(DOB, MRZ_HASH, CURRENT_DATE, MIN_AGE);
      const valid = await verifyAgeProof(proof);

      expect(valid).toBe(true);
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
  });
});
