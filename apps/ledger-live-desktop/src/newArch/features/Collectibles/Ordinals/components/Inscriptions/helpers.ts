import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { IconProps } from "LLD/features/Collectibles/types/Collection";
import { mappingKeysWithIconAndName } from "../Icons";
import { MappingKeys } from "LLD/features/Collectibles/types/Ordinals";

function matchCorrespondingIcon(
  rareSats: SimpleHashNft[],
): Array<SimpleHashNft & { icons: Array<({ size, color, style }: IconProps) => JSX.Element> }> {
  return rareSats.map(rareSat => {
    const iconKeys: string[] = [];
    const rarity = rareSat.extra_metadata?.ordinal_details?.sat_rarity?.toLowerCase();

    if (rarity && rarity !== "common") {
      iconKeys.push(rarity.replace(" ", "_"));
    }

    const icons = iconKeys
      .map(
        iconKey =>
          mappingKeysWithIconAndName[iconKey as keyof typeof mappingKeysWithIconAndName]?.icon,
      )
      .filter(Boolean) as Array<({ size, color, style }: IconProps) => JSX.Element>;

    return { ...rareSat, icons };
  });
}

export function getInscriptionsData(inscriptions: SimpleHashNft[]) {
  const inscriptionsWithIcons = matchCorrespondingIcon(inscriptions);
  return inscriptionsWithIcons.map(item => ({
    tokenName: item.name || item.contract.name || "",
    collectionName: item.collection.name,
    tokenIcons: item.icons,
    rareSatName: [item.extra_metadata?.ordinal_details?.sat_rarity] as MappingKeys[],
    media: {
      uri: item.image_url || item.previews?.image_small_url,
      isLoading: false,
      useFallback: true,
      contentType: item.extra_metadata?.ordinal_details?.content_type,
      mediaType: "image",
    },
    onClick: () => {
      console.log(`you clicked on : \x1b[32m${item.name}\x1b[0m inscription`);
    },
    // it does nothing for now but it will be used for the next PR with the drawer
  }));
}
