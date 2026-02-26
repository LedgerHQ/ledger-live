import type { ScriptType as Psbtv2ScriptType } from "@ledgerhq/psbtv2";
import type { AddressFormat } from "../getWalletPublicKey";

/**
 * Map from scriptPubKey hash (hex) to derivation data.
 * Used to populate missing BIP32 derivations from the wallet's known addresses.
 */
export type KnownAddressDerivationsMap = Map<string, { pubkey: Buffer; path: number[] }>;

/**
 * Options for signPsbtBuffer. Used internally by signPsbt modules.
 */
export interface SignPsbtBufferOptions {
  finalizePsbt: boolean;
  accountPath: string;
  addressFormat: AddressFormat;
  onDeviceSignatureRequested?: () => void;
  onDeviceSignatureGranted?: () => void;
  onDeviceStreaming?: (arg: { progress: number; total: number; index: number }) => void;
  /** Map from scriptPubKey hash (hex) to { pubkey, path }. Built from wallet's known addresses. */
  knownAddressDerivations: KnownAddressDerivationsMap;
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
 * Extends @ledgerhq/psbtv2 ScriptType with "p2sh-p2wpkh" (alias for derivation/signing).
 */
export type ScriptType = Psbtv2ScriptType | "p2sh-p2wpkh";
