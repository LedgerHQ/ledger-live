import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Account, ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import { ContextMenuItemType } from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { useCreateLinks } from "./useCreateLinks";
import { useOpenHideCollectionModal } from "./useOpenHideCollectionModal";
import { useCustomImage } from "./useCustomImage";
import { isNFTMetadata } from "../utils/typeGuardsChecker";

export default (
  account: Account,
  nft: ProtoNFT | SimpleHashNft,
  metadata: NFTMetadata | SimpleHashNft["extra_metadata"],
  onClose?: () => void,
): ContextMenuItemType[] => {
  const { t } = useTranslation();
  const hideCollection = useOpenHideCollectionModal(t, account, nft, metadata, onClose);
  const isSimpleHash = (nft as SimpleHashNft).collection !== undefined;
  const { customImage, showCustomImageButton } = useCustomImage(
    t,
    metadata,
    !isNFTMetadata(metadata) ? (nft as SimpleHashNft) : undefined,
  );

  const links = useCreateLinks(t, metadata, nft, isSimpleHash);

  return useMemo(() => {
    return [
      ...links,
      ...(showCustomImageButton ? [customImage] : []),
      ...(hideCollection ? [hideCollection] : []),
    ];
  }, [links, showCustomImageButton, customImage, hideCollection]);
};
