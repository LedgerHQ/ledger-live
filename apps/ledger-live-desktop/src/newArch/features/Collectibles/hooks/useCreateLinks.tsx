import { useMemo } from "react";
import { TFunction } from "i18next";
import { ContextMenuItemType } from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import { openURL } from "~/renderer/linking";
import { safeList } from "LLD/features/Collectibles/utils/useSafeList";
import { ExternalIdEnum, ItemType, ViewerEnum } from "LLD/features/Collectibles/types/enum/Links";
import IconOpensea from "~/renderer/icons/Opensea";
import IconRarible from "~/renderer/icons/Rarible";
import IconMagicEden from "~/renderer/icons/MagicEden";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { isNFTMetadata } from "../utils/typeGuardsChecker";
import { createOrdinalExplorerUrl } from "../utils/createOrdinalExplorerUrl";

const createLinks = (
  t: TFunction,
  links: Record<string, string> | SimpleHashNft["collection"]["marketplace_pages"] | undefined,
  isSimpleHash: boolean,
  explorerLink?: string,
): ContextMenuItemType[] => {
  if (isSimpleHash) {
    const marketplacePages = Array.isArray(links) ? links : [];
    return safeList(
      [
        ...marketplacePages
          .filter(link => link.marketplace_id === ExternalIdEnum.MAGICEDEN)
          .map(link => ({
            id: link.marketplace_id,
            label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.MAGICEDEN }),
            Icon: IconMagicEden,
            type: ItemType.EXTERNAL,
            callback: () => openURL(link.nft_url),
          })),
        ...(marketplacePages.length > 0 ? [{ id: "sep2", type: "separator", label: "" }] : []),
        ...(explorerLink
          ? [
              {
                id: ExternalIdEnum.EXPLORER,
                label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.EXPLORER }),
                Icon: IconsLegacy.GlobeMedium,
                type: ItemType.EXTERNAL,
                callback: () => openURL(explorerLink),
              },
            ]
          : []),
      ].filter(Boolean),
    );
  } else {
    const linksRecord = links as Record<string, string>;
    return safeList(
      [
        linksRecord.opensea && {
          id: ExternalIdEnum.OPENSEA,
          label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.OPENSEA }),
          Icon: IconOpensea,
          type: ItemType.EXTERNAL,
          callback: () => openURL(linksRecord.opensea),
        },
        linksRecord.rarible && {
          id: ExternalIdEnum.RARIBLE,
          label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.RARIBLE }),
          Icon: IconRarible,
          type: ItemType.EXTERNAL,
          callback: () => openURL(linksRecord.rarible),
        },
        { id: "sep2", type: "separator", label: "" },
        linksRecord.explorer && {
          id: ExternalIdEnum.EXPLORER,
          label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.EXPLORER }),
          Icon: IconsLegacy.GlobeMedium,
          type: ItemType.EXTERNAL,
          callback: () => openURL(linksRecord.explorer),
        },
      ].filter(Boolean),
    );
  }
};

export const useCreateLinks = (
  t: TFunction,
  metadata: NFTMetadata | SimpleHashNft["extra_metadata"],
  nft: ProtoNFT | SimpleHashNft,
  isSimpleHash: boolean,
): ContextMenuItemType[] => {
  const inscriptionNumber = (nft as SimpleHashNft).extra_metadata?.ordinal_details
    ?.inscription_number;

  return useMemo(() => {
    const links = isNFTMetadata(metadata)
      ? metadata.links
      : (nft as SimpleHashNft).collection?.marketplace_pages;
    const explorerLink = isNFTMetadata(metadata)
      ? metadata.links?.explorer
      : createOrdinalExplorerUrl(inscriptionNumber);

    return createLinks(t, links, isSimpleHash, explorerLink);
  }, [t, metadata, nft, isSimpleHash, inscriptionNumber]);
};
