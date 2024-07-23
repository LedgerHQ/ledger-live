import { useNftMetadata } from "@ledgerhq/live-nft-react";
import { nftsByCollections } from "@ledgerhq/live-nft/index";
import { ProtoNFT, NFT, Operation } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { State } from "~/renderer/reducers";
import { accountSelector } from "~/renderer/reducers/accounts";
import { FieldStatus } from "LLD/Collectibles/types/enum/DetailDrawer";
import { openModal } from "~/renderer/actions/modals";
import { useOnScreen } from "LLD/Collectibles/utils/useOnScreen";

const useNftCollectionModel = () => {
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

  const slicedNfts = useMemo(() => nfts.slice(0, maxVisibleNFTs), [nfts, maxVisibleNFTs]);

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
