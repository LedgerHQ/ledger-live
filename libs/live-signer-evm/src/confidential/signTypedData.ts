import { filter, lastValueFrom } from "rxjs";
import type { EIP712Message } from "@ledgerhq/types-live";
import type { EvmSigner } from "../types";

type TypedField = { readonly name: string; readonly type: string };

/**
 * EIP-712 typed data as a confidential-token SDK hands it to the wallet, for instance the user-decrypt
 * permit: numbers may be bigints or decimal strings, and the `EIP712Domain` type may be left out.
 */
export type ConfidentialTypedData = {
  domain: Record<string, unknown>;
  types: Record<string, readonly TypedField[]>;
  primaryType: string;
  message: Record<string, unknown>;
};

/** Signs typed data on the device and resolves the 65-byte signature, `0x` + r + s + v. */
export type SignTypedData = (typedData: ConfidentialTypedData) => Promise<`0x${string}`>;

const DOMAIN_FIELDS: TypedField[] = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "chainId", type: "uint256" },
  { name: "verifyingContract", type: "address" },
  { name: "salt", type: "bytes32" },
];

function toJson<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === "bigint" ? v.toString() : v)),
  ) as T;
}

/** The SDK typed data in the shape the Ethereum signer takes, unchanged in what gets signed. */
export function toEIP712Message(typedData: ConfidentialTypedData): EIP712Message {
  const { domain, types, primaryType, message } = toJson(typedData);
  const domainTypes =
    types.EIP712Domain ?? DOMAIN_FIELDS.filter(field => domain[field.name] !== undefined);
  return {
    domain: {
      ...domain,
      ...(domain.chainId !== undefined ? { chainId: Number(domain.chainId) } : {}),
    },
    types: { ...types, EIP712Domain: [...domainTypes] },
    primaryType,
    message,
  };
}

export function createSignTypedData(
  signer: Pick<EvmSigner, "signEIP712Message">,
  path: string,
): SignTypedData {
  return async typedData => {
    const signed = await lastValueFrom(
      signer
        .signEIP712Message(path, toEIP712Message(typedData))
        .pipe(filter(event => event.type === "signer.evm.signed")),
    );
    const { r, s, v } = signed.value;
    const recovery = typeof v === "string" ? parseInt(v, 16) : v;
    return `0x${r}${s}${recovery.toString(16).padStart(2, "0")}`;
  };
}
