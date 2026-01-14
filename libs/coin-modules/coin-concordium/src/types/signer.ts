export type ConcordiumAddress = {
  publicKey: string;
  address: string;
  path: string;
};

export type ConcordiumSignature = string; // `0x${string}`

import type { CredentialDeploymentTransaction } from "@ledgerhq/concordium-sdk-adapter";
import type { AccountTransactionWithEnergy } from "@ledgerhq/hw-app-concordium/lib/serialization";

export interface ConcordiumSigner {
  getAddress(path: string, display?: boolean): Promise<ConcordiumAddress>;
  signTransaction(path: string, rawTx: string): Promise<ConcordiumSignature>;
  signTransfer(txn: AccountTransactionWithEnergy, path: string): Promise<string>;
  signCredentialDeployment(
    payload: CredentialDeploymentTransaction,
    path: string,
    metadata?: { isNew?: boolean; address?: string },
  ): Promise<{ signature: string[] }>;
  /**
   * Verify account address on device using identity and credential parameters
   *
   * @param isLegacy - If true, uses legacy protocol (P1=0x00), otherwise new protocol (P1=0x01)
   * @param identityIndex - Identity index
   * @param credNumber - Credential counter
   * @param ipIdentity - Identity provider index (only used for new protocol)
   * @param credId - Credential ID (hex string) for computing the correct on-chain address
   * @returns Status of verification, computed address, and device-computed credId
   */
  verifyAddress(
    isLegacy: boolean,
    identityIndex: number,
    credNumber: number,
    ipIdentity?: number,
    credId?: string,
  ): Promise<{ status: string; address?: string; deviceCredId?: string; devicePrfKey?: string }>;
}
