import { CurrencyBridge } from "@ledgerhq/types-live";
import { getTronSuperRepresentatives, hydrateSuperRepresentatives } from "./api";
import { SuperRepresentative } from "./types";

export const preload: CurrencyBridge["preload"] = async () => {
  const superRepresentatives = await getTronSuperRepresentatives();
  return {
    superRepresentatives,
  };
};

export const hydrate: CurrencyBridge["hydrate"] = (data?: {
  superRepresentatives?: SuperRepresentative[];
}) => {
  if (!data || !data.superRepresentatives) return;

  const { superRepresentatives } = data;

  if (
    !superRepresentatives ||
    typeof superRepresentatives !== "object" ||
    !Array.isArray(superRepresentatives)
  ) {
    return;
  }
  hydrateSuperRepresentatives(superRepresentatives);
};
