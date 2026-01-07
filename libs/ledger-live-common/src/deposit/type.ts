import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type MappedAsset = {
  $type: "Token" | "Coin";
  ledgerId: string;
  providerId: string;
  name: string;
  ticker: string;
  network?: string;
  contract?: string;
  status: string;
  reason: null;
  data: {
    img: string;
    marketCapRank: number | null;
  };
  ledgerCurrency?: CryptoOrTokenCurrency;
};

export enum LoadingStatus {
  Idle = "idle",
  Pending = "pending",
  Success = "success",
  Error = "error",
}
