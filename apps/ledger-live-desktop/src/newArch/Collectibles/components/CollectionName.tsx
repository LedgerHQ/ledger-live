import React, { memo } from "react";
import { useNftCollectionMetadata } from "@ledgerhq/live-nft-react";
import { Account, ProtoNFT } from "@ledgerhq/types-live";
import NFTCollectionContextMenu from "~/renderer/components/ContextMenu/NFTCollectionContextMenu";
import { Skeleton } from "LLD/Collectibles/components";
import styled from "styled-components";
import { Flex, IconsLegacy } from "@ledgerhq/react-ui";
import { FieldStatus } from "LLD/Collectibles/types/enum/DetailDrawer";
import { Text } from "@ledgerhq/react-ui";

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
  collectiblesNumber?: number;
};

const CollectionNameComponent: React.FC<Props> = ({
  nft,
  fallback,
  account,
  showHideMenu,
  collectiblesNumber,
}) => {
  const { status, metadata } = useNftCollectionMetadata(nft?.contract, nft?.currencyId);
  const { tokenName } = metadata || {};
  const loading = status === FieldStatus.Loading;
  const isComponentReady = account && showHideMenu && nft;

  return (
    <Skeleton width={80} minHeight={24} barHeight={10} show={loading}>
      <Flex columnGap={"3px"} alignItems={"center"}>
        {tokenName || fallback || "-"}
        {collectiblesNumber && (
          <Text fontWeight="small" color={"neutral.c70"} fontSize={12}>
            ({collectiblesNumber})
          </Text>
        )}
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
