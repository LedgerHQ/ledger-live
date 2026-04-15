import manager from "../modules/ageAttestation";
import type { AgeAttestationLocalState } from "../modules/ageAttestation";

const emptyLocal: AgeAttestationLocalState = {
  verified: false,
  proof: null,
  publicSignals: null,
  minimumAge: null,
  verifiedAt: null,
  proofHash: null,
};

const verifiedLocal: AgeAttestationLocalState = {
  verified: true,
  proof: "encrypted-proof-blob",
  publicSignals: ["20250401", "18", "abc123"],
  minimumAge: 18,
  verifiedAt: "2025-04-01T10:00:00Z",
  proofHash: "abc123",
};

const ctx = {
  getAccountBridge: jest.fn() as any,
  bridgeCache: jest.fn() as any,
};

describe("ageAttestation WalletSync module", () => {
  describe("schema", () => {
    it("should accept valid distant state", () => {
      const result = manager.schema.parse({
        proof: "some-proof",
        publicSignals: ["a", "b"],
        minimumAge: 18,
        verifiedAt: "2025-01-01T00:00:00Z",
        proofHash: "hash",
      });
      expect(result.proof).toBe("some-proof");
    });

    it("should accept empty object", () => {
      const result = manager.schema.parse({});
      expect(result.proof).toBeUndefined();
    });
  });

  describe("diffLocalToDistant", () => {
    it("should report no changes for unverified local state", () => {
      const diff = manager.diffLocalToDistant(emptyLocal, null);
      expect(diff.hasChanges).toBe(false);
    });

    it("should report changes when local has proof and distant is null", () => {
      const diff = manager.diffLocalToDistant(verifiedLocal, null);
      expect(diff.hasChanges).toBe(true);
      expect(diff.nextState.proof).toBe(verifiedLocal.proof);
    });

    it("should report no changes when local matches distant", () => {
      const distant = {
        proof: verifiedLocal.proof!,
        publicSignals: verifiedLocal.publicSignals!,
        minimumAge: verifiedLocal.minimumAge!,
        verifiedAt: verifiedLocal.verifiedAt!,
        proofHash: verifiedLocal.proofHash!,
      };
      const diff = manager.diffLocalToDistant(verifiedLocal, distant);
      expect(diff.hasChanges).toBe(false);
    });
  });

  describe("resolveIncrementalUpdate", () => {
    it("should return no changes when incoming is null", async () => {
      const result = await manager.resolveIncrementalUpdate(ctx, emptyLocal, null, null);
      expect(result.hasChanges).toBe(false);
    });

    it("should return no changes when incoming has no proof", async () => {
      const result = await manager.resolveIncrementalUpdate(ctx, emptyLocal, null, {});
      expect(result.hasChanges).toBe(false);
    });

    it("should return changes when incoming has a proof and local is empty", async () => {
      const incoming = {
        proof: "new-proof",
        publicSignals: ["a"],
        minimumAge: 18,
        verifiedAt: "2025-01-01",
        proofHash: "hash",
      };
      const result = await manager.resolveIncrementalUpdate(ctx, emptyLocal, null, incoming);
      expect(result.hasChanges).toBe(true);
      if (result.hasChanges) {
        expect(result.update.replaceAll).toEqual(incoming);
      }
    });

    it("should return no changes when incoming matches local", async () => {
      const distant = {
        proof: verifiedLocal.proof!,
        publicSignals: verifiedLocal.publicSignals!,
        minimumAge: verifiedLocal.minimumAge!,
        verifiedAt: verifiedLocal.verifiedAt!,
        proofHash: verifiedLocal.proofHash!,
      };
      const result = await manager.resolveIncrementalUpdate(
        ctx,
        verifiedLocal,
        distant,
        distant,
      );
      expect(result.hasChanges).toBe(false);
    });
  });

  describe("applyUpdate", () => {
    it("should apply incoming proof to local state", () => {
      const update = {
        replaceAll: {
          proof: "new-proof",
          publicSignals: ["x", "y"],
          minimumAge: 21,
          verifiedAt: "2025-06-01",
          proofHash: "new-hash",
        },
      };
      const result = manager.applyUpdate(emptyLocal, update);
      expect(result.verified).toBe(true);
      expect(result.proof).toBe("new-proof");
      expect(result.minimumAge).toBe(21);
    });

    it("should keep local values when incoming fields are missing", () => {
      const update = {
        replaceAll: {
          proof: "new-proof",
        },
      };
      const result = manager.applyUpdate(verifiedLocal, update);
      expect(result.proof).toBe("new-proof");
      expect(result.minimumAge).toBe(verifiedLocal.minimumAge);
    });

    it("should not update when incoming has no proof", () => {
      const update = {
        replaceAll: {},
      };
      const result = manager.applyUpdate(verifiedLocal, update);
      expect(result).toEqual(verifiedLocal);
    });
  });
});
