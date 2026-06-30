import type { EIP712Message } from "@ledgerhq/types-live";
import type { QuotePermit2Message } from "../../quotes/types";

/**
 * RFQ provider tag — discriminates the typed-data normalisation rules
 * applied to the quote's `permitData` payload.
 *
 * - `uniswapx`: Dutch / UniswapX RFQ orders. The provider does not pin a
 *   `primaryType` on the wire, so we force `"PermitWitnessTransferFrom"`
 *   to mirror the live-app `signOrderMessage` helper.
 * - `oneinchfusion`: 1inch Fusion RFQ orders. The provider supplies the
 *   `primaryType` (e.g. `"Order"`) and we forward it verbatim.
 */
export type RfqProvider = "uniswapx" | "oneinchfusion";

/**
 * Adapts the quote's optional `QuotePermit2Message` payload into the
 * concrete `EIP712Message` shape expected by the DMK Ethereum signer for
 * RFQ order signing.
 *
 * Mirrors the swap-live-app's `signOrderMessage` helper (see LIVE-31887):
 * - reads the message from either `values` (UniswapX) or `message`
 *   (1inch-fusion);
 * - keeps the partner-provided `EIP712Domain` entries verbatim when
 *   present (1inch Fusion ships a 4-field domain that includes
 *   `version`, which is part of CAL's schema-hash lookup for clear
 *   signing — overriding it forces the device into blind signing) and
 *   falls back to the canonical 3-field Permit2 domain otherwise;
 * - forces `primaryType` to `"PermitWitnessTransferFrom"` for UniswapX
 *   and preserves the provider-supplied `primaryType` for 1inch Fusion.
 *
 * Throws a typed error when the payload is missing required fields so
 * the planner can reject the live-app `customSwap` promise rather than
 * walking into the device flow with bad data.
 */
export function toRfqEIP712Message(
  typedData: QuotePermit2Message,
  provider: RfqProvider,
): EIP712Message {
  const message = typedData.values ?? typedData.message;
  if (!message) {
    throw new Error("RFQ typedData is missing `values` (or `message`)");
  }
  if (!typedData.domain) {
    throw new Error("RFQ typedData is missing `domain`");
  }
  if (!typedData.types) {
    throw new Error("RFQ typedData is missing `types`");
  }

  const primaryType =
    provider === "uniswapx"
      ? "PermitWitnessTransferFrom"
      : typedData.primaryType;
  if (!primaryType) {
    throw new Error(
      "RFQ typedData is missing `primaryType` (1inch-fusion must ship one)",
    );
  }

  // Layer the partner-provided `types` over the canonical Permit2
  // `EIP712Domain` fallback via `Object.assign` so the partner entry
  // (e.g. 1inch Fusion's 4-field domain) wins when present, while
  // avoiding TS2783 / `noImplicitOverride` on a same-key spread.
  const types: EIP712Message["types"] = Object.assign(
    {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
    },
    typedData.types,
  );

  return {
    domain: typedData.domain,
    primaryType,
    message,
    types,
  };
}
