import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { IconsLegacy } from "@ledgerhq/react-ui";
import { ProtoNFT, NFTMetadata, Account } from "@ledgerhq/types-live";
import { TFunction } from "i18next";
import { useMemo } from "react";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import { isNFTMetadata } from "../utils/typeGuardsChecker";

export const useOpenHideCollectionModal = (
  t: TFunction,
  account: Account,
  nft: ProtoNFT | SimpleHashNft,
  metadata: NFTMetadata | SimpleHashNft["extra_metadata"],
  onClose?: () => void,
) => {
  const dispatch = useDispatch();
  return useMemo(() => {
    if (!isNFTMetadata(metadata)) return null;
    const collectionName =
      typeof metadata.tokenName === "string" ? metadata.tokenName : nft.contract;
    return {
      id: "hide-collection",
      label: t("hideNftCollection.hideCTA"),
      Icon: IconsLegacy.NoneMedium,
      callback: () =>
        dispatch(
          openModal("MODAL_HIDE_NFT_COLLECTION", {
            collectionName: collectionName as string,
            collectionId: `${account.id}|${nft.contract}`,
            onClose,
          }),
        ),
    };
  }, [account.id, dispatch, metadata, nft.contract, onClose, t]);
};
