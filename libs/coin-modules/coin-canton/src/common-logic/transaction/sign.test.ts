import {
  createMockCantonSigner,
  createMockOnboardingPrepareResponse,
  createMockPrepareTransferResponse,
} from "../../test/fixtures";
import type { CantonSigner } from "../../types/signer";
import { signTransaction } from "./sign";

const createMockSigner = (signTransactionImpl: CantonSigner["signTransaction"]): CantonSigner => {
  const signer = createMockCantonSigner();
  return {
    getAddress: signer.getAddress.bind(signer),
    signTransaction: signTransactionImpl,
  };
};

describe("signTransaction", () => {
  const mockSigner = createMockSigner(
    jest.fn().mockResolvedValue({
      signature: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
      applicationSignature: "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    }),
  );
  const mockDerivationPath = "44'/6767'/0'/0'/0'";

  it("should sign prepared transaction", async () => {
    // GIVEN
    const mockPrepareTransferResponse = createMockPrepareTransferResponse();

    // WHEN
    const result = await signTransaction(
      mockSigner,
      mockDerivationPath,
      mockPrepareTransferResponse,
    );

    // THEN
    expect(result.signature).toBeDefined();
    expect(result.signature).toMatch(/^[0-9a-f]+$/i);
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it("should sign untyped versioned message", async () => {
    // GIVEN
    const mockOnboardingPrepare = createMockOnboardingPrepareResponse();

    // WHEN
    const result = await signTransaction(mockSigner, mockDerivationPath, mockOnboardingPrepare);

    // THEN
    expect(result.signature).toBeDefined();
    expect(result.signature).toMatch(/^[0-9a-f]+$/i);
    expect(result.applicationSignature).toBeDefined();
    expect(result.applicationSignature).toMatch(/^[0-9a-f]+$/i);
  });

  it("should handle empty signature from signer", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue({ signature: "" });
    const mockSignerWithEmptySignature = createMockSigner(mockSignerSpy);
    const mockPrepareTransferResponse = createMockPrepareTransferResponse();

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
    const mockSignerSpy = jest.fn().mockRejectedValue(new Error("Signer error"));
    const mockSignerWithError = createMockSigner(mockSignerSpy);
    const mockPrepareTransferResponse = createMockPrepareTransferResponse();

    // WHEN & THEN
    await expect(
      signTransaction(mockSignerWithError, mockDerivationPath, mockPrepareTransferResponse),
    ).rejects.toThrow("Signer error");
  });

  it("should call signer with correct parameters for prepared transaction", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue({
      signature: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
    });
    const mockSignerWithSpy = createMockSigner(mockSignerSpy);
    const mockPrepareTransferResponse = createMockPrepareTransferResponse();

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

  it("should call signer with correct parameters for untyped versioned message without challenge", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue({
      signature: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
    });
    const mockSignerWithSpy = createMockSigner(mockSignerSpy);
    const mockOnboardingPrepareResponse = createMockOnboardingPrepareResponse({
      challenge_nonce: "",
      challenge_deadline: 0,
    });

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

  it("should call signer with correct parameters for untyped versioned message with challenge", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue({
      signature: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
      applicationSignature: "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    });
    const mockSignerWithSpy = createMockSigner(mockSignerSpy);
    const mockOnboardingPrepareResponse = createMockOnboardingPrepareResponse();

    // WHEN
    const result = await signTransaction(
      mockSignerWithSpy,
      mockDerivationPath,
      mockOnboardingPrepareResponse,
    );

    // THEN
    expect(result).toEqual({
      signature: "a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef12",
      applicationSignature: "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    });
    expect(mockSignerSpy).toHaveBeenCalledWith(mockDerivationPath, {
      transactions: [
        "namespace-transaction-data",
        "party-to-key-transaction-data",
        "party-to-participant-transaction-data",
      ],
      challenge: "181234567890abcdef000000006774857f",
    });
  });
});
