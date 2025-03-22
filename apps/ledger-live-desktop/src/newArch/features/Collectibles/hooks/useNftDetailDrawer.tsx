import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "react-redux";
import { getNFTById } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { useNftMetadata, useNftCollectionMetadata } from "@ledgerhq/live-nft-react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { NFTMetadata } from "@ledgerhq/types-live";
import { getMetadataMediaType } from "~/helpers/nft";
import { useCallback, useMemo, useState } from "react";
import { openModal } from "~/renderer/actions/modals";
import { createDetails } from "LLD/features/Collectibles/utils/createNftDetailsArrays";
import { setDrawer } from "~/renderer/drawers/Provider";
import isEmpty from "lodash/isEmpty";
import { FieldStatus } from "LLD/features/Collectibles/types/enum/DetailDrawer";
import { useNftFloorPrice } from "@ledgerhq/live-nft-react";

const useNftDetailDrawer = (
  account: Account,
  nftId: string,
  setIsOpened: (isOpened: boolean) => void,
) => {
  const dispatch = useDispatch();
  const state = useSelector((state: State) => state);

  const protoNft = useMemo(() => {
    return (
      getNFTById(state, {
        nftId,
      }) || ({} as ProtoNFT)
    );
  }, [state, nftId]);

  const doNotOpenDrawer = isEmpty(protoNft);

  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    protoNft.contract,
    protoNft.currencyId,
  );

  const { status: nftStatus, metadata } = useNftMetadata(
    protoNft.contract,
    protoNft.tokenId,
    protoNft.currencyId,
  );

  const isLoading = useMemo(
    () => nftStatus === FieldStatus.Loading || collectionStatus === FieldStatus.Loading,
    [collectionStatus, nftStatus],
  );

  const currency = useMemo(() => getCryptoCurrencyById(protoNft.currencyId), [protoNft.currencyId]);

  const { isLoading: isFloorPriceLoading, data } = useNftFloorPrice(protoNft, currency);

  const ticker = data?.ticker || "";
  const floorPrice = data?.value.toString() || null;

  const collectionName = collectionMetadata?.tokenName || "";
  const nftName = (metadata && "nftName" in metadata && metadata.nftName) || protoNft.tokenId;
  const tags = metadata?.properties || [];
  const amount = protoNft.standard === "ERC1155" ? protoNft.amount.toString() : null;

  const details = createDetails(
    metadata as NFTMetadata,
    protoNft,
    amount,
    isFloorPriceLoading,
    floorPrice,
    ticker,
  );

  const contentType = useMemo(
    () => getMetadataMediaType(metadata as NFTMetadata, "big"),
    [metadata],
  );

  const onNFTSend = useCallback(() => {
    setIsOpened(false);
    setDrawer();
    dispatch(
      openModal("MODAL_SEND", {
        account,
        isNFTSend: true,
        nftId,
      }),
    );
  }, [setIsOpened, dispatch, account, nftId]);

  const [useFallback, setUseFallback] = useState(false);
  const { uri: previewUri, mediaType } =
    metadata?.medias[useFallback ? "preview" : ("big" as keyof (typeof metadata)["medias"])] || {};
  const { uri: originalUri } =
    metadata?.medias[useFallback ? "original" : ("big" as keyof (typeof metadata)["medias"])] || {};

  return {
    collectionName,
    nftName,
    tags,
    isLoading,
    details,
    metadata,
    protoNft,
    contentType,
    useFallback,
    previewUri,
    originalUri,
    mediaType,
    doNotOpenDrawer,
    onNFTSend,
    setUseFallback,
  };
};
export default useNftDetailDrawer;
