import { OnboardingPrepareResponse, PrepareTransferResponse } from "../../network/gateway";
import { CantonPreparedTransaction, CantonSigner } from "../../types/signer";
import { signTransaction } from "./sign";

class MockCantonSigner implements CantonSigner {
  async getAddress(path: string, display?: boolean) {
    return {
      publicKey: "mock-public-key",
      address: "mock-address",
      path,
    };
  }

  async signTransaction(
    path: string,
    data: CantonPreparedTransaction | { transactions: string[] },
  ) {
    if ("transactions" in data) {
      return `untyped-signature-${data.transactions.length}`;
    } else {
      return `prepared-transaction-signature-${data.damlTransaction.length}-${data.nodes.length}`;
    }
  }
}

describe("signTransaction", () => {
  const mockSigner = new MockCantonSigner();
  const mockDerivationPath = "44'/6767'/0'/0'/0'";

  it("should sign prepared transaction", async () => {
    // GIVEN
    const mockPrepareTransferResponse: PrepareTransferResponse = {
      json: {
        transaction: {
          version: "2.1",
          roots: ["0"],
          nodes: [
            {
              nodeId: "0",
              v1: {
                create: {
                  lfVersion: "2.1",
                  contractId: "test-contract-id",
                  packageName: "test-package",
                  templateId: {
                    packageId: "test-package-id",
                    moduleName: "TestModule",
                    entityName: "TestEntity",
                  },
                  argument: {
                    record: {
                      recordId: {
                        packageId: "test-package-id",
                        moduleName: "TestModule",
                        entityName: "TestEntity",
                      },
                      fields: [],
                    },
                  },
                },
              },
            },
          ],
        },
        metadata: {
          submitterInfo: {
            actAs: ["test::party"],
            commandId: "test-command-id",
          },
          synchronizerId: "test-synchronizer-id",
          transactionUuid: "test-transaction-uuid",
          submissionTime: "1234567890",
          inputContracts: [],
        },
      },
      serialized: "serialized-transaction",
      hash: "test-hash",
    };

    // WHEN
    const result = await signTransaction(
      mockSigner,
      mockDerivationPath,
      mockPrepareTransferResponse,
    );

    // THEN
    expect(result).toBe("prepared-transaction-signature-10-1");
  });

  it("should sign untyped versioned message", async () => {
    // GIVEN
    const mockOnboardingPrepareResponse: OnboardingPrepareResponse = {
      party_id: "test-party-id",
      party_name: "test-party-name",
      public_key_fingerprint: "test-fingerprint",
      transactions: {
        namespace_transaction: {
          serialized: "namespace-transaction-data",
          json: {},
          hash: "namespace-hash",
        },
        party_to_key_transaction: {
          serialized: "party-to-key-transaction-data",
          json: {},
          hash: "party-to-key-hash",
        },
        party_to_participant_transaction: {
          serialized: "party-to-participant-transaction-data",
          json: {},
          hash: "party-to-participant-hash",
        },
        combined_hash: "combined-hash",
      },
    };

    // WHEN
    const result = await signTransaction(
      mockSigner,
      mockDerivationPath,
      mockOnboardingPrepareResponse,
    );

    // THEN
    expect(result).toBe("untyped-signature-3");
  });

  it("should handle empty signature from signer", async () => {
    // GIVEN
    const mockSignerWithEmptySignature = {
      ...mockSigner,
      signTransaction: jest.fn().mockResolvedValue(""),
    } as unknown as CantonSigner;

    const mockPrepareTransferResponse: PrepareTransferResponse = {
      json: {
        transaction: {
          version: "2.1",
          roots: ["0"],
          nodes: [],
        },
        metadata: {
          submitterInfo: {
            actAs: ["test::party"],
            commandId: "test-command-id",
          },
          synchronizerId: "test-synchronizer-id",
          transactionUuid: "test-transaction-uuid",
          submissionTime: "1234567890",
          inputContracts: [],
        },
      },
      serialized: "serialized-transaction",
      hash: "test-hash",
    };

    // WHEN & THEN
    await expect(
      signTransaction(
        mockSignerWithEmptySignature,
        mockDerivationPath,
        mockPrepareTransferResponse,
      ),
    ).rejects.toThrow("Device returned empty signature");
  });

  it("should handle signer errors", async () => {
    // GIVEN
    const mockSignerWithError = {
      ...mockSigner,
      signTransaction: jest.fn().mockRejectedValue(new Error("Signer error")),
    } as unknown as CantonSigner;

    const mockPrepareTransferResponse: PrepareTransferResponse = {
      json: {
        transaction: {
          version: "2.1",
          roots: ["0"],
          nodes: [],
        },
        metadata: {
          submitterInfo: {
            actAs: ["test::party"],
            commandId: "test-command-id",
          },
          synchronizerId: "test-synchronizer-id",
          transactionUuid: "test-transaction-uuid",
          submissionTime: "1234567890",
          inputContracts: [],
        },
      },
      serialized: "serialized-transaction",
      hash: "test-hash",
    };

    // WHEN & THEN
    await expect(
      signTransaction(mockSignerWithError, mockDerivationPath, mockPrepareTransferResponse),
    ).rejects.toThrow("Signer error");
  });

  it("should call signer with correct parameters for prepared transaction", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue("test-signature");
    const mockSignerWithSpy = {
      ...mockSigner,
      signTransaction: mockSignerSpy,
    } as unknown as CantonSigner;

    const mockPrepareTransferResponse: PrepareTransferResponse = {
      json: {
        transaction: {
          version: "2.1",
          roots: ["0"],
          nodes: [
            {
              nodeId: "0",
              v1: {
                create: {
                  lfVersion: "2.1",
                  contractId: "test-contract-id",
                  packageName: "test-package",
                  templateId: {
                    packageId: "test-package-id",
                    moduleName: "TestModule",
                    entityName: "TestEntity",
                  },
                  argument: {
                    record: {
                      recordId: {
                        packageId: "test-package-id",
                        moduleName: "TestModule",
                        entityName: "TestEntity",
                      },
                      fields: [],
                    },
                  },
                },
              },
            },
          ],
        },
        metadata: {
          submitterInfo: {
            actAs: ["test::party"],
            commandId: "test-command-id",
          },
          synchronizerId: "test-synchronizer-id",
          transactionUuid: "test-transaction-uuid",
          submissionTime: "1234567890",
          inputContracts: [],
        },
      },
      serialized: "serialized-transaction",
      hash: "test-hash",
    };

    // WHEN
    await signTransaction(mockSignerWithSpy, mockDerivationPath, mockPrepareTransferResponse);

    // THEN
    expect(mockSignerSpy).toHaveBeenCalledWith(
      mockDerivationPath,
      expect.objectContaining({
        damlTransaction: expect.any(Uint8Array),
        nodes: expect.any(Array),
        metadata: expect.any(Uint8Array),
        inputContracts: expect.any(Array),
      }),
    );
  });

  it("should call signer with correct parameters for untyped versioned message", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue("test-signature");
    const mockSignerWithSpy = {
      ...mockSigner,
      signTransaction: mockSignerSpy,
    } as unknown as CantonSigner;

    const mockOnboardingPrepareResponse: OnboardingPrepareResponse = {
      party_id: "test-party-id",
      party_name: "test-party-name",
      public_key_fingerprint: "test-fingerprint",
      transactions: {
        namespace_transaction: {
          serialized: "namespace-transaction-data",
          json: {},
          hash: "namespace-hash",
        },
        party_to_key_transaction: {
          serialized: "party-to-key-transaction-data",
          json: {},
          hash: "party-to-key-hash",
        },
        party_to_participant_transaction: {
          serialized: "party-to-participant-transaction-data",
          json: {},
          hash: "party-to-participant-hash",
        },
        combined_hash: "combined-hash",
      },
    };

    // WHEN
    await signTransaction(mockSignerWithSpy, mockDerivationPath, mockOnboardingPrepareResponse);

    // THEN
    expect(mockSignerSpy).toHaveBeenCalledWith(mockDerivationPath, {
      transactions: [
        "namespace-transaction-data",
        "party-to-key-transaction-data",
        "party-to-participant-transaction-data",
      ],
    });
  });
});
