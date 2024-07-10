import React from "react";
import TokenList from "LLD/Collectibles/components/Gallery/TokenList";
import { useTokenListModel } from "./useTokenListModel";
import { Account, NFT, ProtoNFT } from "@ledgerhq/types-live";

type ViewProps = ReturnType<typeof useTokenListModel>;

function View({ account, formattedNfts }: ViewProps) {
  return <TokenList account={account} collectibles={formattedNfts} />;
}

type Props = {
  nfts: (ProtoNFT | NFT)[];
  account: Account;
};

const NftTokensList: React.FC<Props> = ({ ...props }) => (
  <View {...useTokenListModel({ ...props })} />
);

export default NftTokensList;
