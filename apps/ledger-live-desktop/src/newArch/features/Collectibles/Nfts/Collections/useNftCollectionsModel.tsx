import { useCallback, useEffect, useMemo, useState } from "react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { openModal } from "~/renderer/actions/modals";
import { mapCollectionsToStructure } from "LLD/features/Collectibles/utils/collectionUtils";
import { useNftCollections } from "~/renderer/hooks/nfts/useNftCollections";

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

  const { fetchNextPage, hasNextPage, collections, collectionsLength } = useNftCollections({
    account,
  });

  const onShowMore = useCallback(() => {
    setNumberOfVisibleCollections(numberOfVisibleCollections =>
      Math.min(numberOfVisibleCollections + INCREMENT, collectionsLength),
    );
    if (hasNextPage) fetchNextPage();
  }, [collectionsLength, fetchNextPage, hasNextPage]);

  const nftsInTheCollection: NftsInTheCollections[] = useMemo(
    () => mapCollectionsToStructure(collections, numberOfVisibleCollections, onOpenCollection),
    [collections, numberOfVisibleCollections, onOpenCollection],
  );

  useEffect(() => {
    const moreToShow = numberOfVisibleCollections < collections.length;
    setDisplayShowMore(moreToShow);
  }, [numberOfVisibleCollections, collections.length]);

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
