import { useCallback, useEffect, useMemo, useState } from "react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { State } from "~/renderer/reducers";
import { accountSelector } from "~/renderer/reducers/accounts";
import { FieldStatus } from "../../types/DetailDrawer";
import { openModal } from "~/renderer/actions/modals";
import { hiddenNftCollectionsSelector } from "~/renderer/reducers/settings";
import { nftsByCollections } from "@ledgerhq/live-nft/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { isThresholdValid, useNftGalleryFilter } from "@ledgerhq/live-nft-react";
import { filterHiddenCollections, mapCollectionsToStructure } from "../../utils/collectionUtils";

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
  const history = useHistory();

  const { id, collectionAddress } = useParams<{ id: string; collectionAddress: string }>();
  const account = useSelector((state: State) => accountSelector(state, { accountId: id }));

  const listFooterRef = useRef<HTMLDivElement>(null);
  const [maxVisibleNFTs, setMaxVisibleNFTs] = useState(1);

  const nfts = useMemo<(ProtoNFT | NFT)[]>(
    () => (nftsByCollections(account?.nfts, collectionAddress) as (ProtoNFT | NFT)[]) || [],
    [account?.nfts, collectionAddress],
  );

  const [nft] = nfts;
  const { status, metadata } = useNftMetadata(nft?.contract, nft?.tokenId, account?.currency.id);
  const isLoading = useMemo(() => status === FieldStatus.Loading, [status]);

  const onSend = useCallback(() => {
    dispatch(
      openModal("MODAL_SEND", {
        account,
        isNFTSend: true,
        nftCollection: collectionAddress,
      }),
    );
  }, [collectionAddress, dispatch, account]);

  const filterOperation = (op: Operation) =>
    !!op.nftOperations?.length &&
    !!op.nftOperations.find(nftOp => nftOp?.contract === collectionAddress);

  const updateMaxVisibleNtfs = () => setMaxVisibleNFTs(maxVisibleNFTs => maxVisibleNFTs + 5);

  useOnScreen({
    enabled: maxVisibleNFTs < nfts?.length,
    onIntersect: updateMaxVisibleNtfs,
    target: listFooterRef,
    threshold: 0.5,
  });

  const nftsInTheCollection: NftsInTheCollections[] = useMemo(
    () =>
      mapCollectionsToStructure(filteredCollections, numberOfVisibleCollections, onOpenCollection),
    [filteredCollections, numberOfVisibleCollections, onOpenCollection],
  );

  useEffect(() => {
    if (slicedNfts.length <= 0) {
      history.push(`/account/${account?.id}/`);
    }
  }, [account?.id, history, slicedNfts.length]);

  return {
    isLoading,
    collectionAddress,
    account,
    nfts,
    metadata,
    slicedNfts,
    listFooterRef,
    maxVisibleNFTs,
    filterOperation,
    onSend,
  };
};

export default useNftCollectionModel;
