import { TokensListProps } from "LLD/features/Collectibles/types/TokensList";
import { useSelector } from "react-redux";
import { getNFTsByListOfIds } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { useNftMetadataBatch } from "@ledgerhq/live-nft-react";
import { FieldStatus } from "LLD/features/Collectibles/types/enum/DetailDrawer";
import { BaseNftsProps } from "LLD/features/Collectibles/types/Collectibles";
import { useState } from "react";

export const useTokensListModel = ({ nfts, account }: BaseNftsProps): TokensListProps => {
  const nftsIdsList: string[] = Object.keys(
    nfts.reduce((acc, nft) => ({ ...acc, [nft.id]: nft }), {}),
  );

  const nftsList = useSelector((state: State) =>
    getNFTsByListOfIds(state, {
      nftIds: nftsIdsList,
    }),
  );

  const metadata = useNftMetadataBatch(
    nftsList.map(nft => ({
      contract: nft?.contract,
      tokenId: nft?.tokenId,
      currencyId: nft?.currencyId,
    })),
  );

  const formattedNfts = metadata.map((meta, index) => ({
    id: nftsList[index]?.tokenId || "",
    metadata: meta.metadata,
    nft: nftsList[index],
    collectibleId: nftsList[index]?.id || "",
    standard: nftsList[index]?.standard || "",
    amount: nftsList[index]?.amount || "",
    tokenName: meta.metadata?.nftName || meta.metadata?.tokenName || "",
    previewUri: meta?.metadata?.medias.preview.uri || "",
    mediaType: meta?.metadata?.medias.preview.mediaType || "",
    isLoading:
      meta?.status !== FieldStatus.Loaded &&
      meta?.status !== FieldStatus.Error &&
      meta?.status !== FieldStatus.NoData,
  }));

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [nftIdToOpen, setNftIdToOpen] = useState<string>("");
  const onItemClick = (id: string) => {
    setNftIdToOpen(id);
    setIsDrawerOpen(true);
  };

  return {
    account: account,
    formattedNfts: formattedNfts,
    isDrawerOpen,
    nftIdToOpen,
    onItemClick,
    setIsDrawerOpen,
  };
};
