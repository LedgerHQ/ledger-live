import { Account, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { getNFTsByListOfIds } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { useNftMetadataBatch } from "@ledgerhq/live-nft-react";
import { FieldStatus } from "LLD/Collectibles/types/DetailDrawer";
import { BaseNftsProps } from "LLD/Collectibles/types/Collectibles";
import BigNumber from "bignumber.js";
import { useState } from "react";

export type TokenListProps = {
  account: Account;
  formattedNfts: {
    id: string;
    metadata: NFTMetadata | null | undefined;
    nft: ProtoNFT | undefined;
    collectibleId: string;
    standard: string;
    amount: string | BigNumber;
    tokenName: string;
    previewUri: string;
    isLoading: boolean;
    mediaType: string;
  }[];
  isDrawerOpen: boolean;
  nftIdToOpen: string;
  setIsDrawerOpen: (isDrawerOpen: boolean) => void;
  onItemClick: (id: string) => void;
};

export const useTokensListModel = ({ nfts, account }: BaseNftsProps): TokenListProps => {
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
