import { z } from "zod";
import { NetworkSchema } from "./network";
import type { Network } from "./network";

/**
 * AccountDescriptorV1 — the ADR-specified format.
 *
 * ADR: https://ledgerhq.atlassian.net/wiki/spaces/TA/pages/6975946770/ADR+-+Account+descriptor
 *
 * String representation:
 *   UTXO:    account:1:utxo:<network_name>:<network_env>:<xpub>:<hardened_path>
 *   ADDRESS: account:1:address:<network_name>:<network_env>:<address>:<bip44_path>
 *
 * Hardened segments use "h" (shell-safe) instead of the traditional apostrophe "'".
 * Both notations are accepted on input for backward compatibility.
 *
 * Examples:
 *   account:1:utxo:bitcoin:main:xpub6BosfCnifzxcFwrSzQiqu2DBVTshkCXacvNsWGYJVVhhawA7d4R5WSE1S2G4UrqdKFNvJx3bR7MNfYTc4FXnAFzBVNMcJYHx5ENKnG9WNzh:m/84h/0h/0h
 *   account:1:address:ethereum:main:0x71C7656EC7ab88b098defB751B7401B5f6d8976F:m/44h/60h/0h/0/0
 *   account:1:address:solana:main:7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X:m/44h/501h/0h/0h
 *   account:1:utxo:bitcoin:test:tpubD8L6U....:m/84h/1h/0h
 */

const SEP = ":" as const;

/**
 * UTXO-based account descriptor (Bitcoin family).
 *
 * The path contains only hardened BIP32 segments (e.g. m/84'/0'/0').
 * The non-hardened change/address suffix is intentionally omitted: the xpub
 * already represents the full derivation tree from the hardened account root.
 */
export const UtxoAccountDescriptorV1Schema = z.object({
  purpose: z.literal("account"),
  version: z.literal("1"),
  type: z.literal("utxo"),
  network: NetworkSchema,
  /** Extended public key: mainnet xpub/ypub/zpub or testnet tpub/upub/vpub. */
  xpub: z
    .string()
    .min(1)
    .refine(v => !/^[xyztuv]prv/.test(v), {
      message: "xpub field must not contain a private extended key (xprv/yprv/zprv/tprv/uprv/vprv)",
    }),
  /**
   * Hardened-only BIP32 path, e.g. "m/84h/0h/0h" (or legacy "m/84'/0'/0'").
   * All segments must be hardened. "h" is preferred (shell-safe); "'" is also accepted.
   */
  path: z
    .string()
    .regex(/^m(\/\d+[h'])+$/, "UTXO path must only contain hardened segments, e.g. m/84h/0h/0h"),
});

/**
 * Account-based descriptor (EVM, Solana, etc.).
 *
 * Stores the derived address and the full derivation path used to reach it,
 * including the non-hardened change and address-index components where applicable.
 */
export const AccountBasedDescriptorV1Schema = z.object({
  purpose: z.literal("account"),
  version: z.literal("1"),
  type: z.literal("address"),
  network: NetworkSchema,
  /** Derived address for this account (0x... for EVM, base58 for Solana, etc.) */
  address: z.string().min(1),
  /** Full BIP44 derivation path, e.g. "m/44'/60'/0'/0/0" */
  path: z.string().min(1),
});

export const AccountDescriptorV1Schema = z.discriminatedUnion("type", [
  UtxoAccountDescriptorV1Schema,
  AccountBasedDescriptorV1Schema,
]);

export type UtxoAccountDescriptorV1 = z.infer<typeof UtxoAccountDescriptorV1Schema>;
export type AccountBasedDescriptorV1 = z.infer<typeof AccountBasedDescriptorV1Schema>;
export type AccountDescriptorV1 = z.infer<typeof AccountDescriptorV1Schema>;

/**
 * Serialize an AccountDescriptorV1 to its canonical colon-separated string form.
 */
export function serializeV1(descriptor: AccountDescriptorV1): string {
  const { purpose, version, type, network } = descriptor;
  const base = [purpose, version, type, network.name, network.env].join(SEP);
  if (descriptor.type === "utxo") {
    return [base, descriptor.xpub, descriptor.path].join(SEP);
  }
  return [base, descriptor.address, descriptor.path].join(SEP);
}

/**
 * Parse a V1 descriptor string into a structured AccountDescriptorV1.
 * Throws a descriptive error if the string is not a valid V1 descriptor.
 */
export function parseV1(input: string): AccountDescriptorV1 {
  // Expected segments (colon-separated):
  //   [0] "account"
  //   [1] "1"
  //   [2] "utxo" | "account"
  //   [3] network name
  //   [4] network env
  //   [5] xpub or address  (no colons in practice, but we join back just in case)
  //   [6] path             (starts with "m/", no colons)
  // Minimum: 7 segments.
  const parts = input.split(SEP);

  if (parts.length < 7) {
    throw new Error(
      `Invalid AccountDescriptorV1: expected at least 7 colon-separated fields, got ${parts.length} in "${input}"`,
    );
  }

  const [purpose, version, type, networkName, networkEnv, ...rest] = parts;

  if (purpose !== "account") {
    throw new Error(`Invalid AccountDescriptorV1: expected purpose "account", got "${purpose}"`);
  }
  if (version !== "1") {
    throw new Error(`Invalid AccountDescriptorV1: expected version "1", got "${version}"`);
  }

  // The path is the last segment (starts with "m/"); everything before it is the xpub/address.
  const path = rest.at(-1)!;
  const xpubOrAddress = rest.slice(0, -1).join(SEP);

  const network: Network = { name: networkName, env: networkEnv };

  if (type === "utxo") {
    return UtxoAccountDescriptorV1Schema.parse({
      purpose: "account",
      version: "1",
      type: "utxo",
      network,
      xpub: xpubOrAddress,
      path,
    });
  }

  if (type === "address") {
    return AccountBasedDescriptorV1Schema.parse({
      purpose: "account",
      version: "1",
      type: "address",
      network,
      address: xpubOrAddress,
      path,
    });
  }

  throw new Error(`Invalid AccountDescriptorV1 type: "${type}" (expected "utxo" or "address")`);
}
