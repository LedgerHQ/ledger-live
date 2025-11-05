export interface SelectOption {
  value: string;
  label: string;
}

export interface CryptoAssetsListDevToolContentProps {
  expanded?: boolean;
}

export type FamilyType = "ethereum" | "stellar" | "solana" | "aptos" | "cardano" | "sui";

export type FamilyOption = { value: FamilyType; label: string };

export interface TokenListDrawerProps {
  initialFamily?: FamilyType;
}
