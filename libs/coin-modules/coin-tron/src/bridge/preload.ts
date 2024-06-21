import { getTronSuperRepresentatives, hydrateSuperRepresentatives } from "../network";
import { SuperRepresentative } from "../types";

export const preload = async () => {
  const superRepresentatives = await getTronSuperRepresentatives();
  return {
    superRepresentatives,
  };
};

export const hydrate = (data?: { superRepresentatives?: SuperRepresentative[] }) => {
  if (!data || !data.superRepresentatives) return;

  const { superRepresentatives } = data;

  if (
    !superRepresentatives ||
    typeof superRepresentatives !== "object" ||
    !Array.isArray(superRepresentatives)
  )
    return;

  hydrateSuperRepresentatives(superRepresentatives);
};
