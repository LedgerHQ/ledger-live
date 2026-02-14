import type { AddressFormat } from "../getWalletPublicKey";

/**
 * Options for signPsbtBuffer. Used internally by signPsbt modules.
 */
export interface SignPsbtBufferOptions {
  finalizePsbt?: boolean;
  accountPath: string;
  addressFormat: AddressFormat;
  onDeviceSignatureRequested?: () => void;
  onDeviceSignatureGranted?: () => void;
  onDeviceStreaming?: (arg: { progress: number; total: number; index: number }) => void;
  addressScanLimit?: number;
}

/**
 * Discriminator for input vs output derivation handling.
 * Used to consolidate duplicate code for BIP32 derivation operations.
 */
export type DerivationElementType = "input" | "output";

/**
 * Accessors for BIP32 derivation operations that abstract over inputs vs outputs.
 * This allows reusing the same derivation logic for both element types.
 */
export interface DerivationAccessors {
  readonly getKeyDatas: (index: number, keyType: number) => Buffer[];
  readonly getBip32Derivation: (
    index: number,
    pubkey: Buffer,
  ) => { path: number[]; masterFingerprint: Buffer } | undefined;
  readonly getTapBip32Derivation: (
    index: number,
    pubkey: Buffer,
  ) => { path: number[]; masterFingerprint: Buffer; hashes: Buffer[] } | undefined;
  readonly setBip32Derivation: (
    index: number,
    pubkey: Buffer,
    masterFp: Buffer,
    path: number[],
  ) => void;
  readonly setTapBip32Derivation: (
    index: number,
    pubkey: Buffer,
    hashes: Buffer[],
    masterFp: Buffer,
    path: number[],
  ) => void;
  readonly bip32KeyType: number;
  readonly tapBip32KeyType: number;
}

/**
 * Union type for supported Bitcoin script types.
 * Provides type safety for script type detection and handling.
 */
export type ScriptType = "p2wpkh" | "p2tr" | "p2sh" | "p2sh-p2wpkh" | "p2pkh";
