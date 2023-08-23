import React, { useMemo, useCallback, memo } from "react";
import { Trans } from "react-i18next";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Account, NFTMetadata } from "@ledgerhq/types-live";
import { getNFTById } from "~/renderer/reducers/accounts";
import Box, { Card } from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import { centerEllipsis } from "~/renderer/styles/helpers";
import Media from "~/renderer/components/Nft/Media";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { useNftMetadata } from "@ledgerhq/live-common/nft/index";
import NFTContextMenu from "~/renderer/components/ContextMenu/NFTContextMenu";
import NFTViewerDrawer from "~/renderer/drawers/NFTViewerDrawer";
import { setDrawer } from "~/renderer/drawers/Provider";
import { State } from "~/renderer/reducers";
import { IconsLegacy } from "@ledgerhq/react-ui";
const Wrapper = styled(Card)`
  &.disabled {
    pointer-events: none;
  }

  cursor: pointer;
  border: 1px solid transparent;
  transition: background-color ease-in-out 200ms;
  :hover {
    border-color: ${p => p.theme.colors.palette.text.shade20};
  }
  :active {
    border-color: ${p => p.theme.colors.palette.text.shade20};
    background: ${p => p.theme.colors.palette.action.hover};
  }
`;
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
const TitleContainer = styled(Text)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
`;
type Props = {
  account: Account;
  id: string;
  mode: "grid" | "list";
  withContextMenu?: boolean;
  onHideCollection?: () => void;
};
const NftCard = ({ id, mode, account, withContextMenu = false, onHideCollection }: Props) => {
  const nft = useSelector((state: State) =>
    getNFTById(state, {
      nftId: id,
    }),
  );
  const { status, metadata } = useNftMetadata(nft?.contract, nft?.tokenId, nft?.currencyId);
  const { nftName } = (metadata as NFTMetadata) || {};
  const show = useMemo(() => status === "loading", [status]);
  const isGrid = mode === "grid";
  const onItemClick = useCallback(() => {
    setDrawer(
      NFTViewerDrawer,
      {
        account,
        nftId: id,
        isOpen: true,
      },
      { forceDisableFocusTrap: true },
    );
  }, [id, account]);
  const MaybeContext = ({ children }: { children: React.ReactNode }) =>
    withContextMenu && nft && metadata ? (
      <NFTContextMenu key={id} nft={nft} account={account} metadata={metadata as NFTMetadata}>
        {children}
      </NFTContextMenu>
    ) : (
      <>{children}</>
    );
  return (
    <MaybeContext>
      <Wrapper
        px={3}
        py={isGrid ? 3 : 2}
        className={show || process.env.ALWAYS_SHOW_SKELETONS ? "disabled" : ""}
        horizontal={!isGrid}
        alignItems={!isGrid ? "center" : undefined}
        onClick={onItemClick}
      >
        <Skeleton width={40} minHeight={40} full={isGrid} show={show}>
          <Media
            metadata={metadata as NFTMetadata}
            tokenId={nft?.tokenId}
            size={40}
            full={isGrid}
            mediaFormat="preview"
          />
        </Skeleton>
        <Box ml={isGrid ? 0 : 3} flex={1} mt={isGrid ? 2 : 0}>
          <Skeleton width={142} minHeight={24} barHeight={10} show={show}>
            <TitleContainer
              ff="Inter|Medium"
              color="palette.text.shade100"
              fontSize={isGrid ? 4 : 3}
            >
              {nftName || "-"}
            </TitleContainer>
          </Skeleton>
          <Skeleton width={180} minHeight={24} barHeight={6} show={show}>
            <Box horizontal justifyContent="space-between">
              <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={isGrid ? 3 : 2}>
                <Trans
                  i18nKey="NFT.gallery.tokensList.item.tokenId"
                  values={{
                    tokenId: centerEllipsis(nft?.tokenId),
                  }}
                />
              </Text>
              {nft?.standard === "ERC1155" && isGrid && (
                <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={3}>
                  {`x${nft.amount.toFixed()}`}
                </Text>
              )}
            </Box>
          </Skeleton>
        </Box>
        {!isGrid ? (
          <>
            {nft?.standard === "ERC1155" && (
              <Text ff="Inter|Medium" color="palette.text.shade50" fontSize={3} mr={15}>
                {`x${nft.amount.toFixed()}`}
              </Text>
            )}
            {nft && metadata && (
              <NFTContextMenu
                key={id}
                nft={nft}
                account={account}
                metadata={metadata as NFTMetadata}
                leftClick={true}
                onHideCollection={onHideCollection}
              >
                <Dots>
                  <IconsLegacy.OthersMedium size={20} />
                </Dots>
              </NFTContextMenu>
            )}
          </>
        ) : null}
      </Wrapper>
    </MaybeContext>
  );
};
export default memo<Props>(NftCard);
