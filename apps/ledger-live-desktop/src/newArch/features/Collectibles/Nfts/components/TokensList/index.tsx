import React from "react";
import TokensList from "LLD/features/Collectibles/components/Gallery/TokenList";
import { useTokensListModel } from "./useTokensListModel";
import { BaseNftsProps } from "LLD/features/Collectibles/types/Collectibles";
import NftDetailDrawer from "LLD/features/Collectibles/Nfts/components/DetailDrawer";

type ViewProps = ReturnType<typeof useTokensListModel>;

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
      {nftIdToOpen && (
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
  <View {...useTokensListModel({ ...props })} />
);

export default NftTokensList;
