import type {
  Address,
  VerifyAddressResponse,
  AccountTransaction,
  CredentialDeploymentTransaction,
  SignCredentialDeploymentMetadata,
} from "@ledgerhq/hw-app-concordium/lib/types";

/**
 * Signer interface for Concordium device operations.
 *
 * This interface matches hw-app-concordium methods exactly.
 * All types are hw-app format (Buffer, primitives), not SDK types.
 *
 * Transformation from SDK → hw-app format happens in the bridge/business logic layer.
 * Implementation: ledger-live-common/families/concordium/setup.ts (just instantiates hw-app)
 */
export interface ConcordiumSigner {
  /**
   * Get Concordium address for a given path.
   */
  getAddress(
    path: string,
    display?: boolean,
    id?: number,
    cred?: number,
    idp?: number,
    isLegacy?: boolean,
  ): Promise<Address>;

  /**
   * Get public key for a given path.
   */
  getPublicKey(path: string, confirm?: boolean): Promise<string>;

  /**
   * Sign an account transaction (hw-app format).
   */
  signTransfer(txn: AccountTransaction, path: string): Promise<string>;

  /**
   * Sign a credential deployment transaction (hw-app format).
   */
  signCredentialDeployment(
    payload: CredentialDeploymentTransaction,
    path: string,
    metadata?: SignCredentialDeploymentMetadata,
  ): Promise<string>;

  /**
   * Verify account address on device.
   */
  verifyAddress(
    isLegacy: boolean,
    identityIndex: number,
    credNumber: number,
    ipIdentity?: number,
    credId?: string,
  ): Promise<VerifyAddressResponse>;
}
