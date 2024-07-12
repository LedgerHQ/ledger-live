import React, { memo } from "react";
import { useNftCollectionMetadata } from "@ledgerhq/live-nft-react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import NFTCollectionContextMenu from "~/renderer/components/ContextMenu/NFTCollectionContextMenu";
import { Skeleton } from "LLD/Collectibles/components";
import styled from "styled-components";
import { Flex, IconsLegacy } from "@ledgerhq/react-ui";
import { FieldStatus } from "LLD/Collectibles/types/DetailDrawer";

const Dots = styled.div`
  justify-content: flex-end;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  color: ${p => p.theme.colors.palette.text.shade50};
  &:hover {
    color: ${p => p.theme.colors.palette.text.shade80};
  }
`;

type Props = {
  nft?: ProtoNFT;
  fallback?: string;
  account?: Account;
  showHideMenu?: boolean;
};

const CollectionNameComponent: React.FC<Props> = ({ nft, fallback, account, showHideMenu }) => {
  const { status, metadata } = useNftCollectionMetadata(nft?.contract, nft?.currencyId);
  const { tokenName } = metadata || {};
  const loading = status === FieldStatus.Loading;
  const isComponentReady = account && showHideMenu && nft;

  return (
    <Skeleton width={80} minHeight={24} barHeight={10} show={loading}>
      <Flex columnGap={"6px"} alignItems={"center"}>
        {tokenName || fallback || "-"}
        {isComponentReady && (
          <NFTCollectionContextMenu
            collectionName={tokenName || fallback || "-"}
            collectionAddress={nft.contract || ""}
            account={account}
            leftClick={true}
          >
            <Dots>
              <IconsLegacy.OthersMedium size={20} />
            </Dots>
          </NFTCollectionContextMenu>
        )}
      </Flex>
    </Skeleton>
  );
};
export const CollectionName = memo<Props>(CollectionNameComponent);
