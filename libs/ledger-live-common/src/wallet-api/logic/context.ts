import { AccountLike } from "@ledgerhq/types-live";
import type { TrackingAPI } from "../tracking";
import { AppManifest, TranslatableString } from "../types";

export function translateContent(content: string | TranslatableString, locale = "en"): string {
  if (!content || typeof content === "string") return content;
  return content[locale] || content.en;
}

export type WalletAPIContext = {
  manifest: AppManifest;
  accounts: AccountLike[];
  tracking: TrackingAPI;
};
