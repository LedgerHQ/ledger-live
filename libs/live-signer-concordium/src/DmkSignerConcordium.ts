import { lastValueFrom } from "rxjs";
import type { ConcordiumSigner, ConcordiumNetwork } from "@ledgerhq/coin-concordium/types";
import {
  serializeTransaction,
  serializeCredentialDeploymentValues,
  serializeIdOwnershipProofs,
  encodeWord64,
  type Address,
  type CredentialDeploymentTransaction,
  type Transaction,
  type SigningResult,
} from "@ledgerhq/concordium-core";
import {
  DeviceActionStatus,
  type DeviceActionState,
  type DeviceManagementKit,
} from "@ledgerhq/device-management-kit";
import {
  ConcordiumAddressVerificationFailedError,
  ConcordiumTrustedMetadataServiceError,
  LockedDeviceError,
  UserRefusedOnDevice,
} from "@ledgerhq/errors";
import {
  type SignerConcordium,
  SignerConcordiumBuilder,
  type GetPublicKeyDAError,
  type SignTransactionDAError,
  type SignCredentialDeploymentTransactionDAError,
  type VerifyAddressDAError,
} from "@ledgerhq/device-signer-kit-concordium";

type DAError =
  | GetPublicKeyDAError
  | SignTransactionDAError
  | SignCredentialDeploymentTransactionDAError
  | VerifyAddressDAError;

export class DmkSignerConcordium implements ConcordiumSigner {
  private readonly signer: SignerConcordium;

  constructor(dmk: DeviceManagementKit, sessionId: string) {
    this.signer = new SignerConcordiumBuilder({ dmk, sessionId }).build();
  }

  async getPublicKey(path: string, confirm = false): Promise<string> {
    const { observable } = this.signer.getPublicKey(path, {
      checkOnDevice: confirm,
      skipOpenApp: true,
    });

    const result = this.mapResult(await lastValueFrom(observable));
    return Buffer.from(result.publicKey).toString("hex");
  }

  async getAddress(
    path: string,
    display = false,
    _id?: number,
    _cred?: number,
    _idp?: number,
  ): Promise<Address> {
    if (display) {
      throw new Error(
        "getAddress(display=true) is not yet supported via DMK signer: on-device address verification is unavailable",
      );
    }

    const publicKey = await this.getPublicKey(path, false);
    return { address: publicKey, publicKey };
  }

  async signTransaction(tx: Transaction, path: string): Promise<SigningResult> {
    const serialized = serializeTransaction(tx);

    const { observable } = this.signer.signTransaction(path, new Uint8Array(serialized), {
      skipOpenApp: true,
    });

    const result = this.mapResult(await lastValueFrom(observable));
    const signature = Buffer.from(result).toString("hex");

    return { signature, serialized: serialized.toString("hex") };
  }

  async signCredentialDeployment(
    tx: CredentialDeploymentTransaction,
    path: string,
  ): Promise<string> {
    const transaction = this.serializeCredentialDeploymentToBytes(tx);

    const { observable } = this.signer.signCredentialDeploymentTransaction(path, transaction, {
      skipOpenApp: true,
    });

    const result = this.mapResult(await lastValueFrom(observable));
    return Buffer.from(result).toString("hex");
  }

  async verifyAddress(path: string, address: string, network: ConcordiumNetwork): Promise<void> {
    const { observable } = this.signer.verifyAddress(path, address, network, {
      skipOpenApp: true,
    });

    const confirmed = this.mapResult(await lastValueFrom(observable));
    if (confirmed !== true) {
      throw new Error("Address verification did not complete on the device");
    }
  }

  private serializeCredentialDeploymentToBytes(tx: CredentialDeploymentTransaction): Uint8Array {
    const credentialValues = serializeCredentialDeploymentValues(tx);
    const proofs = serializeIdOwnershipProofs(tx.proofs);
    const proofLength = Buffer.alloc(4);
    proofLength.writeUInt32BE(proofs.length, 0);
    const expiry = encodeWord64(tx.expiry);
    const newOrExisting = Buffer.from([0x00]);

    return new Uint8Array(
      Buffer.concat([credentialValues, proofLength, proofs, newOrExisting, expiry]),
    );
  }

  private mapResult<T, E extends DAError>(actionState: DeviceActionState<T, E, unknown>): T {
    switch (actionState.status) {
      case DeviceActionStatus.Completed:
        return actionState.output;
      case DeviceActionStatus.Error:
        throw this.mapError(actionState.error);
      default:
        throw new Error("Unexpected device action status");
    }
  }

  private mapError<E extends DAError>(error: E): Error {
    const originalMessage = this.originalErrorMessage(error);

    if (!("errorCode" in error)) {
      return new Error(this.formatGenericMessage(error._tag, originalMessage));
    }

    switch (error.errorCode) {
      case "5515":
        return new LockedDeviceError();
      case "6985":
        return new UserRefusedOnDevice();
      case "trusted_metadata_service_error":
        return new ConcordiumTrustedMetadataServiceError(originalMessage);
      case "address_verification_failed":
        return new ConcordiumAddressVerificationFailedError(originalMessage);
      default:
        return new Error(this.formatGenericMessage(error._tag, originalMessage));
    }
  }

  private originalErrorMessage<E extends DAError>(error: E): string | undefined {
    return "originalError" in error && error.originalError instanceof Error
      ? error.originalError.message
      : undefined;
  }

  private formatGenericMessage(tag: string, originalMessage: string | undefined): string {
    return originalMessage ? `${tag}: ${originalMessage}` : tag;
  }
}
