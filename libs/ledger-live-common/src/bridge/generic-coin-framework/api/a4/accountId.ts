import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";

function sha256Hex(input: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(input)));
}

/**
 * Normalize the account key before hashing.
 *
 * EVM addresses are case-insensitive (EIP-55 checksum vs lowercase are the same account), so we
 * lowercase them. Everything else — Bitcoin xpubs and other base58/bech32 addresses (XRP, Stellar,
 * Tezos, …) — is case-sensitive: lowercasing would corrupt it (e.g. a base58 xpub), so we keep it
 * verbatim.
 */
export function normalizeAccountKey(xpubOrAddress: string): string {
  return /^0x[0-9a-fA-F]+$/.test(xpubOrAddress)
    ? xpubOrAddress.toLowerCase()
    : xpubOrAddress;
}

/**
 * Derive a deterministic A4 account id from a Ledger Live account's `xpubOrAddress`.
 *
 * Per ADR-040, one A4 account maps to one derivation path: an address for account-based chains
 * (EVM, XRP, …) and an xpub for UTXO chains (Bitcoin). For Bitcoin the id is therefore a hash of the
 * (case-sensitive) xpub.
 *
 * The id hashes **only** the key — no network/namespace prefix. The A4 network is conveyed by the
 * request URL, so the same key under different networks maps to distinct A4 accounts server-side.
 * It must be derivable with no extra persisted state and stable across app versions/platforms, so we
 * hash the normalized key and format it as a UUID (the shape A4 uses in its docs).
 */
export function deriveA4AccountId(xpubOrAddress: string): string {
  const hex = sha256Hex(normalizeAccountKey(xpubOrAddress));
  // Format the first 128 bits as a UUID-shaped string (8-4-4-4-12).
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Compute the A4 account version, mirroring the A4 backend's algorithm **exactly**: `SHA-256` (hex)
 * of the address values, sorted and joined with "|". Sending it as `A4-If-Account-Version` lets the
 * server detect a datacenter missing addresses (it answers `412`) without persisting any version.
 *
 * Scala reference (A4 backend):
 * ```scala
 * val payload = addresses.map(_.value).sorted.mkString("|")
 * val digest  = ByteVector(payload.getBytes(UTF_8)).sha256.toHex
 * ```
 *
 * The version must hash the **exact** strings registered server-side, so this function does NOT
 * normalize — callers pass already-canonical addresses (see `addressesFor`, which normalizes once
 * and feeds the same values to `addAddresses`). Normalizing here instead would risk hashing a
 * different string than the one registered, yielding a permanent `412`.
 */
export function computeA4AccountVersion(addresses: string[]): string {
  return sha256Hex([...addresses].sort().join("|"));
}
