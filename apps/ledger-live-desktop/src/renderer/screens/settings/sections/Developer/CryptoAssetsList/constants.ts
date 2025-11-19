import { TOKEN_OUTPUT_FIELDS } from "@ledgerhq/cryptoassets/cal-client/state-manager/fields";
import { FamilyOption } from "./types";

export const FAMILY_OPTIONS: FamilyOption[] = [
  { value: "ethereum", label: "Ethereum" },
  { value: "stellar", label: "Stellar" },
  { value: "solana", label: "Solana" },
  { value: "aptos", label: "Aptos" },
  { value: "cardano", label: "Cardano" },
  { value: "sui", label: "Sui" },
];

export const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "100", label: "100" },
  { value: "1000", label: "1000" },
];

export const OUTPUT_FIELD_OPTIONS = TOKEN_OUTPUT_FIELDS.map(field => ({
  value: field,
  label: field.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
}));
