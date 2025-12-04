import {
  createMockCantonSigner,
  createMockOnboardingPrepareResponse,
  createMockPrepareTransferResponse,
} from "../../test/fixtures";
import type { CantonSigner } from "../../types/signer";
import { signTransaction } from "./sign";

describe("signTransaction", () => {
  const mockSigner = createMockCantonSigner();
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
    const mockOnboardingPrepareResponse = createMockOnboardingPrepareResponse();

    // WHEN
    const result = await signTransaction(
      mockSigner,
      mockDerivationPath,
      mockOnboardingPrepareResponse,
    );

    // THEN
    expect(result.signature).toBeDefined();
    expect(result.signature).toMatch(/^[0-9a-f]+$/i);
    expect(result.applicationSignature).toBeDefined();
    expect(result.applicationSignature).toMatch(/^[0-9a-f]+$/i);
  });

  it("should handle empty signature from signer", async () => {
    // GIVEN
    const mockSignerWithEmptySignature = {
      ...mockSigner,
      signTransaction: jest.fn().mockResolvedValue(""),
    } as unknown as CantonSigner;

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
    const mockSignerWithError = {
      ...mockSigner,
      signTransaction: jest.fn().mockRejectedValue(new Error("Signer error")),
    } as unknown as CantonSigner;

    const mockPrepareTransferResponse = createMockPrepareTransferResponse();

    // WHEN & THEN
    await expect(
      signTransaction(mockSignerWithError, mockDerivationPath, mockPrepareTransferResponse),
    ).rejects.toThrow("Signer error");
  });

  it("should call signer with correct parameters for prepared transaction", async () => {
    // GIVEN
    const mockSignerSpy = jest.fn().mockResolvedValue({ signature: "test-signature" });
    const mockSignerWithSpy = {
      ...mockSigner,
      signTransaction: mockSignerSpy,
    } as unknown as CantonSigner;

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
    const mockSignerSpy = jest.fn().mockResolvedValue({ signature: "test-signature" });
    const mockSignerWithSpy = {
      ...mockSigner,
      signTransaction: mockSignerSpy,
    } as unknown as CantonSigner;

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
    const mockSignerSpy = jest.fn().mockResolvedValue({
      signature: "main-signature",
      applicationSignature: "challenge-signature",
    });
    const mockSignerWithSpy = {
      ...mockSigner,
      signTransaction: mockSignerSpy,
    } as unknown as CantonSigner;

    const mockOnboardingPrepareResponse = createMockOnboardingPrepareResponse();

    const result = await signTransaction(
      mockSignerWithSpy,
      mockDerivationPath,
      mockOnboardingPrepareResponse,
    );

    expect(result).toEqual({
      signature: "main-signature",
      applicationSignature: "challenge-signature",
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
