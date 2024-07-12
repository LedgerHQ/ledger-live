import React from "react";
import TokensList from "LLD/Collectibles/components/Gallery/TokenList";
import { useTokenListModel } from "./useTokenListModel";
import { BaseNftsProps } from "LLD/Collectibles/types/Collectibles";

type ViewProps = ReturnType<typeof useTokenListModel>;

function View({ account, formattedNfts }: ViewProps) {
  return <TokensList account={account} collectibles={formattedNfts} />;
}

const NftTokensList: React.FC<BaseNftsProps> = ({ ...props }) => (
  <View {...useTokenListModel({ ...props })} />
);

export default NftTokensList;
