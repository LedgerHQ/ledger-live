import { Account, NFT, ProtoNFT } from "@ledgerhq/types-live";
import { useSelector } from "react-redux";
import { getNFTsByListOfIds } from "~/renderer/reducers/accounts";
import { State } from "~/renderer/reducers";
import { useNftMetadataBatch } from "@ledgerhq/live-nft-react";
import { FieldStatus } from "~/newArch/Collectibles/types/DetailDrawer";

type TokenListModel = {
  account: Account;
  formattedNfts: {
    id: string;
    tokenName: string;
    previewUri: string;
    isLoading: boolean;
    mediaType: string;
  }[];
};

type Props = {
  nfts: (ProtoNFT | NFT)[];
  account: Account;
};

export const useTokenListModel = ({ nfts, account }: Props): TokenListModel => {
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
    tokenName: meta?.metadata?.tokenName || "",
    previewUri: meta?.metadata?.medias.preview.uri || "",
    mediaType: meta?.metadata?.medias.preview.mediaType || "",
    isLoading:
      meta?.status !== FieldStatus.Loaded &&
      meta?.status !== FieldStatus.Error &&
      meta?.status !== FieldStatus.NoData,
  }));

  console.log("metadata", metadata, status);

  return {
    account: account,
    formattedNfts: formattedNfts,
  };
};
