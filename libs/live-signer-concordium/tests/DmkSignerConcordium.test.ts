import { DeviceActionStatus, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  ConcordiumAddressVerificationFailedError,
  ConcordiumInvalidMaxFeeError,
  ConcordiumTrustedMetadataServiceError,
  LockedDeviceError,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";
import { SignerConcordiumBuilder } from "@ledgerhq/device-signer-kit-concordium";
import { TransactionType, AccountAddress } from "@ledgerhq/concordium-core";
import type { Transaction, CredentialDeploymentTransaction } from "@ledgerhq/concordium-core";
import { of } from "rxjs";
import { DmkSignerConcordium } from "../src/DmkSignerConcordium";

jest.mock("@ledgerhq/device-signer-kit-concordium", () => {
  return {
    SignerConcordiumBuilder: jest.fn(),
  };
});

describe("DmkSignerConcordium", () => {
  let signer: DmkSignerConcordium;
  const mockPath = "44'/919'/0'/0'/0'";

  const mockSignerConcordium = {
    getPublicKey: jest.fn(),
    signTransaction: jest.fn(),
    signCredentialDeploymentTransaction: jest.fn(),
    verifyAddress: jest.fn(),
  };

  const dmkMock = {
    executeDeviceAction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(SignerConcordiumBuilder).mockImplementation(() => {
      return {
        build: () => mockSignerConcordium,
      } as unknown as SignerConcordiumBuilder;
    });

    signer = new DmkSignerConcordium(dmkMock as unknown as DeviceManagementKit, "sessionId");
  });

  describe("getPublicKey", () => {
    it("should return hex public key", async () => {
      const pubKeyBytes = new Uint8Array(32).fill(0xaa);
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { publicKey: pubKeyBytes },
        }),
      });

      const result = await signer.getPublicKey(mockPath);

      expect(result).toBe("aa".repeat(32));
      expect(mockSignerConcordium.getPublicKey).toHaveBeenCalledWith(mockPath, {
        checkOnDevice: false,
        skipOpenApp: true,
      });
    });

    it("should pass confirm flag to checkOnDevice", async () => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { publicKey: new Uint8Array(32) },
        }),
      });

      await signer.getPublicKey(mockPath, true);

      expect(mockSignerConcordium.getPublicKey).toHaveBeenCalledWith(mockPath, {
        checkOnDevice: true,
        skipOpenApp: true,
      });
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "LockedDevice", errorCode: "5515" },
        }),
      });

      await expect(signer.getPublicKey(mockPath)).rejects.toThrow(LockedDeviceError);
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "UserRejected", errorCode: "6985" },
        }),
      });

      await expect(signer.getPublicKey(mockPath)).rejects.toThrow(UserRefusedOnDevice);
    });

    it("should throw generic error for unknown error code", async () => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "UnknownError", errorCode: "6f00" },
        }),
      });

      await expect(signer.getPublicKey(mockPath)).rejects.toThrow("UnknownError");
    });

    it("should throw generic error when no errorCode", async () => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "SomeDAError" },
        }),
      });

      await expect(signer.getPublicKey(mockPath)).rejects.toThrow("SomeDAError");
    });

    it("should include originalError.message in generic error when present", async () => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: {
            _tag: "InvalidStatusWordError",
            originalError: new Error("Failed to fetch account ownership context: Network Error"),
          },
        }),
      });

      await expect(signer.getPublicKey(mockPath)).rejects.toThrow(
        "InvalidStatusWordError: Failed to fetch account ownership context: Network Error",
      );
    });

    it.each([
      DeviceActionStatus.NotStarted,
      DeviceActionStatus.Pending,
      DeviceActionStatus.Stopped,
    ])("should throw for unexpected status %s", async status => {
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({ status }),
      });

      await expect(signer.getPublicKey(mockPath)).rejects.toThrow(
        "Unexpected device action status",
      );
    });
  });

  describe("getAddress", () => {
    it("should return address and publicKey using getPublicKey under the hood", async () => {
      const pubKeyBytes = new Uint8Array(32).fill(0xbb);
      mockSignerConcordium.getPublicKey.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: { publicKey: pubKeyBytes },
        }),
      });

      const result = await signer.getAddress(mockPath, false, 0, 0, 0);

      const expectedHex = "bb".repeat(32);
      expect(result).toEqual({ address: expectedHex, publicKey: expectedHex });
    });

    it("should throw when display=true (not yet supported)", async () => {
      await expect(signer.getAddress(mockPath, true, 0, 0, 0)).rejects.toThrow(
        "getAddress(display=true) is not yet supported via DMK signer",
      );
    });
  });

  describe("signTransaction", () => {
    const mockTx: Transaction = {
      header: {
        sender: AccountAddress.fromBase58("3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G"),
        nonce: 1n,
        expiry: 1000n,
        energyAmount: 1000n,
      },
      type: TransactionType.Transfer,
      payload: {
        toAddress: AccountAddress.fromBase58("3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G"),
        amount: 1000000n,
      },
    };

    const mockMaxFee = 1234n;

    it("should return signature and serialized transaction", async () => {
      const signatureBytes = new Uint8Array(64).fill(0xcc);
      mockSignerConcordium.signTransaction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: signatureBytes,
        }),
      });

      const result = await signer.signTransaction(mockTx, mockPath, mockMaxFee);

      expect(result.signature).toBe("cc".repeat(64));
      expect(typeof result.serialized).toBe("string");
      expect(mockSignerConcordium.signTransaction).toHaveBeenCalledWith(
        mockPath,
        expect.any(Uint8Array),
        mockMaxFee,
        { skipOpenApp: true },
      );
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      mockSignerConcordium.signTransaction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "UserRejected", errorCode: "6985" },
        }),
      });

      await expect(signer.signTransaction(mockTx, mockPath, mockMaxFee)).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("should map invalid_max_fee error to ConcordiumInvalidMaxFeeError", async () => {
      mockSignerConcordium.signTransaction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: {
            _tag: "InvalidMaxFeeError",
            errorCode: "invalid_max_fee",
            originalError: new Error("Invalid maxFee: must be non-negative"),
          },
        }),
      });

      await expect(signer.signTransaction(mockTx, mockPath, mockMaxFee)).rejects.toThrow(
        ConcordiumInvalidMaxFeeError,
      );
    });
  });

  describe("signCredentialDeployment", () => {
    const mockCredDeployTx: CredentialDeploymentTransaction = {
      credentialPublicKeys: {
        keys: { "0": { schemeId: "Ed25519", verifyKey: "aa".repeat(32) } },
        threshold: 1,
      },
      credId: "bb".repeat(48),
      ipIdentity: 0,
      revocationThreshold: 1,
      arData: {
        "1": { encIdCredPubShare: "cc".repeat(96) },
      },
      policy: {
        validTo: "202612",
        createdAt: "202601",
        revealedAttributes: {},
      },
      proofs: {
        sig: "dd".repeat(64),
        commitments: "ee".repeat(32),
        challenge: "ff".repeat(32),
        proofIdCredPub: {},
        proofIpSig: "aa".repeat(32),
        proofRegId: "bb".repeat(32),
        credCounterLessThanMaxAccounts: "cc".repeat(32),
      },
      expiry: 2000n,
    };

    it("should return hex signature", async () => {
      const signatureBytes = new Uint8Array(64).fill(0xdd);
      mockSignerConcordium.signCredentialDeploymentTransaction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: signatureBytes,
        }),
      });

      const result = await signer.signCredentialDeployment(mockCredDeployTx, mockPath);

      expect(result).toBe("dd".repeat(64));
      expect(mockSignerConcordium.signCredentialDeploymentTransaction).toHaveBeenCalledWith(
        mockPath,
        expect.any(Uint8Array),
        { skipOpenApp: true },
      );
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      mockSignerConcordium.signCredentialDeploymentTransaction.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "UserRejected", errorCode: "6985" },
        }),
      });

      await expect(signer.signCredentialDeployment(mockCredDeployTx, mockPath)).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });
  });

  describe("verifyAddress", () => {
    const ADDRESS = "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G";
    const NETWORK = "mainnet" as const;

    it("should resolve when device completes verification", async () => {
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: true,
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).resolves.toBeUndefined();
      expect(mockSignerConcordium.verifyAddress).toHaveBeenCalledWith(mockPath, ADDRESS, NETWORK, {
        skipOpenApp: true,
      });
    });

    it("should throw when device completes with a non-true output", async () => {
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Completed,
          output: false,
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        "Address verification did not complete on the device",
      );
    });

    it("should throw UserRefusedOnDevice when user refuses", async () => {
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "UserRejected", errorCode: "6985" },
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        UserRefusedOnDevice,
      );
    });

    it("should throw LockedDeviceError when device is locked", async () => {
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "LockedDevice", errorCode: "5515" },
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        LockedDeviceError,
      );
    });

    it("should throw generic error for unknown error code", async () => {
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: { _tag: "TrustedNameMismatch", errorCode: "6b0c" },
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        "TrustedNameMismatch",
      );
    });

    it("should throw ConcordiumTrustedMetadataServiceError on trusted_metadata_service_error", async () => {
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: {
            _tag: "ConcordiumTrustedMetadataServiceError",
            errorCode: "trusted_metadata_service_error",
            originalError: new Error("Backend unavailable"),
          },
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        ConcordiumTrustedMetadataServiceError,
      );
    });

    it("should throw ConcordiumAddressVerificationFailedError on address_verification_failed", async () => {
      const backendMessage =
        "Address ByteVector(32 bytes, 0xa63c) is not associated with the given public key ByteVector(32 bytes, 0x9dc1) on the network Testnet";
      mockSignerConcordium.verifyAddress.mockReturnValue({
        observable: of({
          status: DeviceActionStatus.Error,
          error: {
            _tag: "AddressVerificationFailedError",
            errorCode: "address_verification_failed",
            originalError: new Error(backendMessage),
          },
        }),
      });

      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        ConcordiumAddressVerificationFailedError,
      );
      await expect(signer.verifyAddress(mockPath, ADDRESS, NETWORK)).rejects.toThrow(
        backendMessage,
      );
    });
  });
});
