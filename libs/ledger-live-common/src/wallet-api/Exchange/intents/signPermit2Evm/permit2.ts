import type { EIP712Message } from "@ledgerhq/types-live";
import type { QuotePermit2Message } from "../../quotes/types";

/**
 * Adapts the quote's optional `QuotePermit2Message` payload into the
 * concrete `EIP712Message` shape expected by the DMK Ethereum signer.
 *
 * Mirrors the live-app's `handlePermitSignature` normalisation
 * (apps/live-app/src/app/multi-step-transaction/_stepMachine/actions/handlePermitSignature.ts):
 * it pins the `EIP712Domain` types entry (Permit2's domain only carries
 * `name` / `chainId` / `verifyingContract`) and forces `primaryType` to
 * `"PermitSingle"` when the quote omits it.
 *
 * Throws a typed error when the payload is missing required fields so
 * the planner can reject the live-app `customSwap` promise rather than
 * walking into the device flow with bad data.
 */
export function toEIP712Message(typedData: QuotePermit2Message): EIP712Message {
  const message = typedData.values ?? typedData.message;
  if (!message) {
    throw new Error("Permit2 typedData is missing `values` (or `message`)");
  }
  if (!typedData.domain) {
    throw new Error("Permit2 typedData is missing `domain`");
  }
  if (!typedData.types) {
    throw new Error("Permit2 typedData is missing `types`");
  }

  return {
    domain: typedData.domain,
    primaryType: typedData.primaryType ?? "PermitSingle",
    message,
    types: {
      ...typedData.types,
      // Force the canonical Permit2 `EIP712Domain` entries last so a
      // partial / empty value in the input cannot override them
      // ("Required for Ledger Live - follow EIP-712 specs" per the
      // live-app's `handlePermitSignature.ts`).
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
    },
  };
}
