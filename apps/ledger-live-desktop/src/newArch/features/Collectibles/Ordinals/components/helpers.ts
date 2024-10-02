import { mappingKeysWithIconAndName } from "./Icons";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import {
  SimpleHashNftWithIcons,
  RareSat,
  MappingKeys,
} from "LLD/features/Collectibles/types/Ordinals";

function processSingleRareSat(rareSat: SimpleHashNft): SimpleHashNftWithIcons {
  const iconKeys: string[] = [];
  if (rareSat.name) {
    iconKeys.push(rareSat.name.toLowerCase().replace(" ", "_"));
  }

  if (rareSat.extra_metadata?.utxo_details?.satributes) {
    iconKeys.push(...Object.keys(rareSat.extra_metadata.utxo_details.satributes));
  }

  const icons = iconKeys
    .map(
      iconKey =>
        mappingKeysWithIconAndName[iconKey as keyof typeof mappingKeysWithIconAndName]?.icon,
    )
    .filter(Boolean) as RareSat["icons"];

  return { ...rareSat, icons };
}

function mapToRareSat(rareSat: SimpleHashNftWithIcons, isMultipleRow: boolean): RareSat {
  const { icons, extra_metadata } = rareSat;
  const year = extra_metadata?.utxo_details?.sat_ranges?.[0]?.year || "";
  const displayed_names =
    Object.values(extra_metadata?.utxo_details?.satributes || {})
      .map(attr => attr.display_name)
      .join(" / ") || "";
  const names = rareSat.extra_metadata?.utxo_details?.satributes
    ? (Object.keys(rareSat.extra_metadata.utxo_details.satributes) as MappingKeys[])
    : [];
  const count = extra_metadata?.utxo_details?.value || 0;

  return {
    year,
    displayed_names,
    names,
    count: `${count} ${count > 1 ? "sats" : "sat"}`,
    isMultipleRow,
    icons,
  };
}

function processRareSatObject(
  rareSats: Record<string, SimpleHashNftWithIcons[]>,
): Record<string, RareSat[]> {
  const result: Record<string, RareSat[]> = {};

  for (const [key, value] of Object.entries(rareSats)) {
    result[key] = value.map(rareSat => mapToRareSat(rareSat, value.length > 1));
  }

  return result;
}

export function matchCorrespondingIcon(
  rareSats: SimpleHashNft | SimpleHashNft[],
): SimpleHashNftWithIcons[] {
  const rareSatArray = Array.isArray(rareSats) ? rareSats : [rareSats];
  return rareSatArray.map(processSingleRareSat);
}

export function createRareSatObject(
  rareSats: Record<string, SimpleHashNftWithIcons[]> | SimpleHashNftWithIcons[],
): Record<string, RareSat[]> {
  if (Array.isArray(rareSats)) {
    return { default: rareSats.map(rareSat => mapToRareSat(rareSat, rareSats.length > 1)) };
  } else {
    return processRareSatObject(rareSats);
  }
}
