import React, { useMemo } from "react";
import { Icons } from "@ledgerhq/react-ui";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import { TableHeaderProps, TableHeaderTitleKey as TitleKey } from "../../types/Collection";
import HeaderActions from "LLD/Collectibles/components/Collection/HeaderActions";
import { hiddenNftCollectionsSelector } from "~/renderer/reducers/settings";
import { nftsByCollections } from "@ledgerhq/live-nft/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isThresholdValid, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import { NftsInTheCollections as NftsInTheCollectionsType } from "./index";

type Props = {
  account: Account;
  collectionAddress: string;
};

export const useNftCollectionModel = ({ account, collectionAddress }: Props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = nftsFromSimplehashFeature?.params?.threshold;
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);

  const onReceive = () =>
    dispatch(
      openModal("MODAL_RECEIVE", {
        account,
        receiveNFTMode: true,
      }),
    );

  const onOpenCollection = () =>
    history.push(`/account/${account.id}/nft-collection/${collectionAddress}`);

  const { nfts, fetchNextPage, hasNextPage } = useNftGalleryFilter({
    nftsOwned: account.nfts || [],
    addresses: account.freshAddress,
    chains: [account.currency.id],
    threshold: isThresholdValid(thresold) ? Number(thresold) : 75,
  });

  const collections = useMemo(
    () => nftsByCollections(nftsFromSimplehashFeature?.enabled ? nfts : account.nfts),
    [account.nfts, nfts, nftsFromSimplehashFeature],
  );

  const nftsInTheCollection: NftsInTheCollectionsType[] = Object.entries(collections).map(
    ([contract, nfts]) => ({
      contract,
      nft: nfts[0] as ProtoNFT,
      nftsNumber: Number(nfts.length),
      isLoading: false,
      onClick: () => onOpenCollection,
    }),
  );

  const actions =
    nftsInTheCollection.length > 0
      ? [
          {
            element: (
              <HeaderActions textKey="NFT.collections.receiveCTA">
                <Icons.ArrowDown size="S" />
              </HeaderActions>
            ),
            action: onReceive,
          },
          {
            element: <HeaderActions textKey="NFT.collections.galleryCTA" />,
            action: onOpenCollection,
          },
        ]
      : [];

  const tableHeaderProps: TableHeaderProps = {
    titleKey: TitleKey.NFTCollections,
    actions: actions,
  };

  return {
    tableHeaderProps,
    nftsInTheCollection,
    onReceive,
  };
};
