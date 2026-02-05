import type {
  Address,
  VerifyAddressResponse,
  CredentialDeploymentTransaction,
  Transaction,
  SigningResult,
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
   * When display=true, id/cred/idp are required.
   */
  getAddress(
    path: string,
    display?: boolean,
    id?: number,
    cred?: number,
    idp?: number,
  ): Promise<Address>;

  /**
   * Get public key for a given path.
   */
  getPublicKey(path: string, confirm?: boolean): Promise<string>;

  /**
   * Sign a transaction (Transfer or TransferWithMemo).
   * Routes to the appropriate signing method based on transaction type.
   * Returns both signature and serialized transaction.
   */
  signTransaction(tx: Transaction, path: string): Promise<SigningResult>;

  /**
   * Sign a credential deployment transaction (hw-app format).
   * Always creates credentials for new accounts on existing identities.
   */
  signCredentialDeployment(tx: CredentialDeploymentTransaction, path: string): Promise<string>;

  /**
   * Verify account address on device.
   */
  verifyAddress(
    identityIndex: number,
    credNumber: number,
    ipIdentity: number,
    credId?: string,
  ): Promise<VerifyAddressResponse>;
}
