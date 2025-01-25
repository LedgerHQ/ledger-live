import React, { memo } from "react";
import ContextMenuItem from "./ContextMenuItem";
import { Account, ProtoNFT, NFTMetadata } from "@ledgerhq/types-live";
import useNftLinks from "~/renderer/hooks/nfts/useNftLinks";

type Props = {
  account: Account;
  nft: ProtoNFT;
  metadata: NFTMetadata;
  leftClick?: boolean;
  children: React.ReactNode;
  onHideCollection?: () => void;
};
const NFTContextMenu = ({
  leftClick,
  children,
  account,
  nft,
  metadata,
  onHideCollection,
}: Props) => {
  const links = useNftLinks(account, nft, metadata, onHideCollection);
  return (
    <ContextMenuItem leftClick={leftClick} items={links}>
      {children}
    </ContextMenuItem>
  );
};
export default memo<Props>(NFTContextMenu);
