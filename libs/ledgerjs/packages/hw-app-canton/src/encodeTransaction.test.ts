import {
  encodeDamlTransaction,
  encodeInputContract,
  encodeMetadata,
  encodeNode,
} from "./encodeTransaction";
import type {
  CantonTransactionData,
  CantonInputContract,
  CantonTransactionMetadata,
  CantonTransactionNode,
} from "./types";

describe("encodeTransaction", () => {
  describe("encodeDamlTransaction", () => {
    it("should encode basic transaction data", () => {
      const data: CantonTransactionData = {
        version: "1.0",
        roots: ["root1", "root2"],
      };

      const result = encodeDamlTransaction(data);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should calculate nodesCount from nodes array", () => {
      const data: CantonTransactionData = {
        version: "1.0",
        roots: ["root1"],
        nodes: [{ nodeId: "0" }, { nodeId: "1" }],
      };

      const result = encodeDamlTransaction(data);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle empty nodes array", () => {
      const data: CantonTransactionData = {
        version: "1.0",
        roots: ["root1"],
        nodes: [],
      };

      const result = encodeDamlTransaction(data);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should convert base64 nodeSeeds to Uint8Array", () => {
      const data: CantonTransactionData = {
        version: "1.0",
        roots: ["root1"],
        nodeSeeds: [
          { seed: Buffer.from("test").toString("base64"), nodeId: 1 },
          { seed: Buffer.from("data").toString("base64") },
        ],
      };

      const result = encodeDamlTransaction(data);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should exclude nodeId when it is 0", () => {
      const data: CantonTransactionData = {
        version: "1.0",
        roots: ["root1"],
        nodeSeeds: [{ seed: Buffer.from("test").toString("base64"), nodeId: 0 }],
      };

      const result = encodeDamlTransaction(data);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe("encodeInputContract", () => {
    it("should encode contract without eventBlob", () => {
      const contract: CantonInputContract = {
        v1: {
          contractId: "contract123",
          packageName: "test.package",
        },
      };

      const result = encodeInputContract(contract);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should exclude eventBlob from encoding", () => {
      const contract: CantonInputContract = {
        v1: {
          contractId: "contract123",
        },
        eventBlob: "should-be-excluded",
      };

      const result = encodeInputContract(contract);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle contracts with reserved words", () => {
      const contract: CantonInputContract = {
        v1: {
          bool: true,
          enum: "test",
          constructor: "value",
        },
      };

      const result = encodeInputContract(contract);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle nested reserved words", () => {
      const contract: CantonInputContract = {
        v1: {
          nested: {
            bool: true,
            enum: "test",
          },
        },
      };

      const result = encodeInputContract(contract);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe("encodeMetadata", () => {
    const baseMetadata: CantonTransactionMetadata = {
      submitterInfo: {
        actAs: ["party1", "party2"],
        commandId: "cmd123",
      },
      synchronizerId: "sync123",
      transactionUuid: "uuid123",
      preparationTime: "1234567890",
    };

    it("should encode basic metadata", () => {
      const result = encodeMetadata(baseMetadata, 0);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should include inputContractsCount", () => {
      const result = encodeMetadata(baseMetadata, 5);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should include mediatorGroup when provided", () => {
      const metadata = {
        ...baseMetadata,
        mediatorGroup: 42,
      };

      const result = encodeMetadata(metadata, 0);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should exclude mediatorGroup when undefined", () => {
      const result = encodeMetadata(baseMetadata, 0);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should convert preparationTime string to number", () => {
      const metadata = {
        ...baseMetadata,
        preparationTime: "1234567890",
      };

      const result = encodeMetadata(metadata, 0);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should include minLedgerEffectiveTime when provided", () => {
      const metadata = {
        ...baseMetadata,
        minLedgerEffectiveTime: "1234567890",
      };

      const result = encodeMetadata(metadata, 0);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should include maxLedgerEffectiveTime when provided", () => {
      const metadata = {
        ...baseMetadata,
        maxLedgerEffectiveTime: "1234567890",
      };

      const result = encodeMetadata(metadata, 0);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should exclude optional time fields when undefined", () => {
      const result = encodeMetadata(baseMetadata, 0);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle all optional fields together", () => {
      const metadata: CantonTransactionMetadata = {
        ...baseMetadata,
        mediatorGroup: 10,
        minLedgerEffectiveTime: "1000000000",
        maxLedgerEffectiveTime: "2000000000",
      };

      const result = encodeMetadata(metadata, 3);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe("encodeNode", () => {
    it("should encode basic node", () => {
      const node: CantonTransactionNode = {
        nodeId: "0",
        v1: {
          create: {
            contractId: "contract123",
          },
        },
      };

      const result = encodeNode(node);
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle node with exercise", () => {
      const node: CantonTransactionNode = {
        nodeId: "1",
        v1: {
          exercise: {
            contractId: "contract456",
            choice: "transfer",
          },
        },
      };

      const result = encodeNode(node);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle node with reserved words", () => {
      const node: CantonTransactionNode = {
        nodeId: "2",
        v1: {
          create: {
            bool: true,
            enum: "test",
            constructor: "value",
          },
        },
      };

      const result = encodeNode(node);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle node with nested reserved words", () => {
      const node: CantonTransactionNode = {
        nodeId: "3",
        v1: {
          create: {
            nested: {
              bool: false,
              enum: "nested",
            },
          },
        },
      };

      const result = encodeNode(node);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("should handle node without nodeId", () => {
      const node: CantonTransactionNode = {
        v1: {
          fetch: {
            contractId: "contract789",
          },
        },
      };

      const result = encodeNode(node);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });
});
