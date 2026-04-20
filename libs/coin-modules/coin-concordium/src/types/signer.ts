import type {
  Address,
  CredentialDeploymentTransaction,
  Transaction,
  SigningResult,
} from "@ledgerhq/concordium-core";
import type { ConcordiumNetwork } from "./config";

/**
 * Signer interface for Concordium device operations.
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
   * Verify a Concordium account address on device using the trusted backend pattern.
   * Fetches a signed account ownership descriptor from the metadata service,
   * loads it onto the device, and displays the address for user confirmation.
   */
  verifyAddress(path: string, address: string, network: ConcordiumNetwork): Promise<void>;
}
