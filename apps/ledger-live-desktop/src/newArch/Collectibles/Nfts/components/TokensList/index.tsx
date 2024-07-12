import React from "react";
import TokensList from "LLD/Collectibles/components/Gallery/TokenList";
import { useTokenListModel } from "./useTokenListModel";
import { BaseNftsProps } from "LLD/Collectibles/types/Collectibles";
import NftDetailDrawer from "LLD/Collectibles/Nfts/components/DetailDrawer";

type ViewProps = ReturnType<typeof useTokenListModel>;

function View({
  account,
  formattedNfts,
  isDrawerOpen,
  nftIdToOpen,
  setIsDrawerOpen,
  onItemClick,
}: ViewProps) {
  return (
    <>
      <TokensList account={account} collectibles={formattedNfts} onItemClick={onItemClick} />
      {isDrawerOpen && (
        <NftDetailDrawer
          isOpened={isDrawerOpen}
          setIsOpened={setIsDrawerOpen}
          account={account}
          tokenId={nftIdToOpen}
        />
      )}
    </>
  );
}

const NftTokensList: React.FC<BaseNftsProps> = ({ ...props }) => (
  <View {...useTokenListModel({ ...props })} />
);

export default NftTokensList;
