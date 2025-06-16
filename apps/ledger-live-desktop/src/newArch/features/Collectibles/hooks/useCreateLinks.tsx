import { useMemo } from "react";
import { TFunction } from "i18next";
import { ContextMenuItemType } from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import { openURL } from "~/renderer/linking";
import { ExternalIdEnum, ItemType, ViewerEnum } from "LLD/features/Collectibles/types/enum/Links";
import IconOpensea from "~/renderer/icons/Opensea";
import IconRarible from "~/renderer/icons/Rarible";
import IconMagicEden from "~/renderer/icons/MagicEden";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { isNFTMetadata } from "../utils/typeGuardsChecker";
import { createOrdinalExplorerUrl } from "../utils/createOrdinalExplorerUrl";

const createSimpleHashLinks = (
  t: TFunction,
  links: NFTMetadata["links"] | SimpleHashNft["collection"]["marketplace_pages"],
  explorerLink?: string | null,
): ContextMenuItemType[] => {
  const marketplacePages = Array.isArray(links) ? links : [];
  const list: ContextMenuItemType[] = marketplacePages
    .filter(link => link.marketplace_id === ExternalIdEnum.MAGICEDEN)
    .map(link => ({
      id: link.marketplace_id,
      label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.MAGICEDEN }),
      Icon: IconMagicEden,
      type: ItemType.EXTERNAL,
      callback: () => openURL(link.nft_url),
    }));

  if (list.length > 0) {
    list.push({ id: "sep2", type: ItemType.SEPARATOR, label: "" });
  }

  if (explorerLink) {
    list.push({
      id: ExternalIdEnum.EXPLORER,
      label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.EXPLORER }),
      Icon: IconsLegacy.GlobeMedium,
      type: ItemType.EXTERNAL,
      callback: () => openURL(explorerLink),
    });
  }
  return list;
};

const createLinks = (
  t: TFunction,
  links: NFTMetadata["links"] | SimpleHashNft["collection"]["marketplace_pages"],
  isSimpleHash: boolean,
  explorerLink?: string | null,
): ContextMenuItemType[] => {
  if (isSimpleHash) {
    return createSimpleHashLinks(t, links, explorerLink);
  } else {
    const linksRecord = Array.isArray(links) ? undefined : links;
    const list: ContextMenuItemType[] = [];

    if (linksRecord?.opensea) {
      const link = linksRecord.opensea;
      list.push({
        id: ExternalIdEnum.OPENSEA,
        label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.OPENSEA }),
        Icon: IconOpensea,
        type: ItemType.EXTERNAL,
        callback: () => openURL(link),
      });
    }

    if (linksRecord?.rarible) {
      const link = linksRecord.rarible;
      list.push({
        id: ExternalIdEnum.RARIBLE,
        label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.RARIBLE }),
        Icon: IconRarible,
        type: ItemType.EXTERNAL,
        callback: () => openURL(link),
      });
    }

    list.push({ id: "sep2", type: ItemType.SEPARATOR, label: "" });

    if (linksRecord?.explorer) {
      const link = linksRecord.explorer;
      list.push({
        id: ExternalIdEnum.EXPLORER,
        label: t("NFT.viewer.actions.open", { viewer: ViewerEnum.EXPLORER }),
        Icon: IconsLegacy.GlobeMedium,
        type: ItemType.EXTERNAL,
        callback: () => openURL(link),
      });
    }

    return list;
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
