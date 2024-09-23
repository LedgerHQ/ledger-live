import { mappingKeysWithIconAndName } from "../Icons";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import {
  SimpleHashNftWithIcons,
  RareSat,
  MappingKeys,
} from "LLD/features/Collectibles/types/Ordinals";

export function matchCorrespondingIcon(rareSats: SimpleHashNft[]): SimpleHashNftWithIcons[] {
  return rareSats.map(rareSat => {
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
  });
}

export function createRareSatObject(
  rareSats: Record<string, SimpleHashNftWithIcons[]>,
): Record<string, RareSat[]> {
  const result: Record<string, RareSat[]> = {};

  for (const [key, value] of Object.entries(rareSats)) {
    result[key] = value.map(rareSat => {
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
      const isMultipleRow = value.length > 1;

      return {
        year,
        displayed_names,
        names,
        count: `${count} ${count > 1 ? "sats" : "sat"}`,
        isMultipleRow,
        icons,
      };
    });
  }

  return result;
}
