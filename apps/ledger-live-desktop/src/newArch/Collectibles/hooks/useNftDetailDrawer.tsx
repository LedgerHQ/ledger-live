import { Account, ProtoNFT } from "@ledgerhq/types-live";
import { useDispatch, useSelector } from "react-redux";
import { getNFTById } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { useNftMetadata, useNftCollectionMetadata } from "@ledgerhq/live-nft-react";
import { getFloorPrice } from "@ledgerhq/live-nft/api/metadataservice";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { FloorPrice, NFTMetadata } from "@ledgerhq/types-live";
import { getMetadataMediaType } from "~/helpers/nft";
import { useCallback, useEffect, useMemo, useState } from "react";
import { openModal } from "~/renderer/actions/modals";
import { createDetails } from "LLD/Collectibles/utils/createNftDetailsArrays";
import { setDrawer } from "~/renderer/drawers/Provider";

const useNftDetailDrawer = (account: Account, nftId: string) => {
  const dispatch = useDispatch();

  const state = useSelector((state: State) => state);
  const protoNft = useMemo(() => {
    return (
      getNFTById(state, {
        nftId,
      }) || ({} as ProtoNFT) // This seems really wrong to fallback to an empty object here…
    );
  }, [state, nftId]);
  // if returns undefined don't open drawer
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
    () => nftStatus === "loading" || collectionStatus === "loading",
    [collectionStatus, nftStatus],
  );

  const [floorPriceLoading, setFloorPriceLoading] = useState(false);
  const [ticker, setTicker] = useState("");
  const [floorPrice, setFloorPrice] = useState<number | null>(null);
  const currency = useMemo(() => getCryptoCurrencyById(protoNft.currencyId), [protoNft.currencyId]);

  useEffect(() => {
    setFloorPriceLoading(true);
    getFloorPrice(protoNft, currency)
      .then((result: FloorPrice | null) => {
        if (result) {
          setTicker(result.ticker);
          setFloorPrice(result.value);
        }
      })
      .finally(() => setFloorPriceLoading(false));
  }, [protoNft, currency]);

  const collectionName = collectionMetadata?.tokenName || "";
  const nftName = (metadata && "nftName" in metadata && metadata.nftName) || protoNft.tokenId;
  const tags = metadata?.properties || [];
  const amount = protoNft.standard === "ERC1155" ? protoNft.amount.toString() : null;

  const details = createDetails(
    metadata as NFTMetadata,
    protoNft,
    amount,
    floorPriceLoading,
    floorPrice ? floorPrice.toString() : null,
    ticker,
  );

  const contentType = useMemo(
    () => getMetadataMediaType(metadata as NFTMetadata, "big"),
    [metadata],
  );

  const onNFTSend = useCallback(() => {
    setDrawer();
    dispatch(
      openModal("MODAL_SEND", {
        account,
        isNFTSend: true,
        nftId,
      }),
    );
  }, [dispatch, nftId, account]);

  return {
    collectionName,
    nftName,
    tags,
    isLoading,
    details,
    metadata,
    protoNft,
    contentType,
    onNFTSend,
  };
};
export default useNftDetailDrawer;
