import React from "react";
import TokenList from "LLD/Collectibles/components/Gallery/TokenList";
import { useTokenListModel } from "./useTokenListModel";

type Props = ReturnType<typeof useTokenListModel>;

function View({ account, collectibles }: Props) {
  return <TokenList account={account} collectibles={collectibles} />;
}

const NftTokensList: React.FC = () => <View {...useTokenListModel()} />;

export default NftTokensList;
