import {
  CONTACTS_FEATURE_FLAG_KEYS,
  DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
} from "@features/flow-contacts";

export const CONTACTS_FLAG = CONTACTS_FEATURE_FLAG_KEYS.mobile;

export const ELIGIBLE_ADDRESS_FAMILIES_PRESETS = [
  {
    id: "evm-only",
    label: "EVM only",
    families: [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
  },
] as const;
