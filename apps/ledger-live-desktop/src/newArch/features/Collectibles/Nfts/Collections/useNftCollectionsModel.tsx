import { useCallback, useEffect, useMemo, useState } from "react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import { hiddenNftCollectionsSelector } from "~/renderer/reducers/settings";
import { nftsByCollections } from "@ledgerhq/live-nft/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isThresholdValid, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import {
  filterHiddenCollections,
  mapCollectionsToStructure,
} from "LLD/features/Collectibles/utils/collectionUtils";

type NftsInTheCollections = {
  contract: string;
  nft: ProtoNFT;
  nftsNumber: number;
  onClick: (collectionAddress: string) => void;
};

type Props = {
  account: Account;
};
const INCREMENT = 5;

export const useNftCollectionsModel = ({ account }: Props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const nftsFromSimplehashFeature = useFeature("nftsFromSimplehash");
  const thresold = nftsFromSimplehashFeature?.params?.threshold;
  const hiddenNftCollections = useSelector(hiddenNftCollectionsSelector);
  const [numberOfVisibleCollections, setNumberOfVisibleCollections] = useState(INCREMENT);
  const [displayShowMore, setDisplayShowMore] = useState(false);

  const onReceive = useCallback(() => {
    dispatch(
      openModal("MODAL_RECEIVE", {
        account,
        receiveNFTMode: true,
      }),
    );
  }, [dispatch, account]);

  const onOpenCollection = useCallback(
    (collectionAddress?: string) => {
      history.push(`/account/${account.id}/nft-collection/${collectionAddress}`);
    },
    [account.id, history],
  );

  const onOpenGallery = useCallback(() => {
    history.push(`/account/${account.id}/nft-collection`);
  }, [account.id, history]);

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

  const collectionsLength = Object.keys(collections).length;

  const onShowMore = useCallback(() => {
    setNumberOfVisibleCollections(numberOfVisibleCollections =>
      Math.min(numberOfVisibleCollections + INCREMENT, collectionsLength),
    );
    if (hasNextPage) fetchNextPage();
  }, [collectionsLength, fetchNextPage, hasNextPage]);

  const filteredCollections = useMemo(
    () => filterHiddenCollections(collections, hiddenNftCollections, account.id),
    [account.id, collections, hiddenNftCollections],
  );

  const nftsInTheCollection: NftsInTheCollections[] = useMemo(
    () =>
      mapCollectionsToStructure(filteredCollections, numberOfVisibleCollections, onOpenCollection),
    [filteredCollections, numberOfVisibleCollections, onOpenCollection],
  );

  useEffect(() => {
    const moreToShow = numberOfVisibleCollections < filteredCollections.length;
    setDisplayShowMore(moreToShow);
  }, [numberOfVisibleCollections, filteredCollections.length]);

  return {
    nftsInTheCollection,
    account,
    displayShowMore,
    onOpenGallery,
    onReceive,
    onOpenCollection,
    onShowMore,
  };
};
