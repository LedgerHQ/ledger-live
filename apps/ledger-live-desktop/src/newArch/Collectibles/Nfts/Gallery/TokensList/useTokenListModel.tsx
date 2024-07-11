import { Account } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { getNFTsByListOfIds } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { useNftMetadataBatch } from "@ledgerhq/live-nft-react";
import { FieldStatus } from "LLD/Collectibles/types/DetailDrawer";
import { BaseNftsProps } from "LLD/Collectibles/types/Collectibles";
import BigNumber from "bignumber.js";

export type TokenListProps = {
  account: Account;
  formattedNfts: {
    id: string;
    standard: string;
    amount: string | BigNumber;
    tokenName: string;
    previewUri: string;
    isLoading: boolean;
    mediaType: string;
  }[];
};

export const useTokenListModel = ({ nfts, account }: BaseNftsProps): TokenListProps => {
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
    standard: nftsList[index]?.standard || "",
    amount: nftsList[index]?.amount || "",
    tokenName: meta?.metadata?.tokenName || "",
    previewUri: meta?.metadata?.medias.preview.uri || "",
    mediaType: meta?.metadata?.medias.preview.mediaType || "",
    isLoading:
      meta?.status !== FieldStatus.Loaded &&
      meta?.status !== FieldStatus.Error &&
      meta?.status !== FieldStatus.NoData,
  }));

  return {
    account: account,
    formattedNfts: formattedNfts,
  };
};
