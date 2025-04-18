import React, { useMemo, useCallback, useState, memo } from "react";
import {
  useNftMetadata,
  useNftCollectionMetadata,
  useNftFloorPrice,
} from "@ledgerhq/live-nft-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useSelector, useDispatch } from "react-redux";
import { space, layout, position, PositionProps, LayoutProps, SpaceProps } from "styled-system";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { Account, NFTMetadata, ProtoNFT } from "@ledgerhq/types-live";
import Box from "~/renderer/components/Box";
import Text from "~/renderer/components/Text";
import Button from "~/renderer/components/Button";
import IconSend from "~/renderer/icons/Send";
import ZoomInIcon from "~/renderer/icons/ZoomIn";
import { getNFTById } from "~/renderer/reducers/accounts";
import { NFTProperties } from "./NFTProperties";
import { CopiableField } from "./CopiableField";
import NftPanAndZoom from "./NftPanAndZoom";
import ExternalViewerButton from "./ExternalViewerButton";
import Skeleton from "~/renderer/components/Nft/Skeleton";
import { getMetadataMediaType } from "~/helpers/nft";
import Media from "~/renderer/components/Nft/Media";
import { openModal } from "~/renderer/actions/modals";
import { setDrawer } from "~/renderer/drawers/Provider";
import { SplitAddress } from "~/renderer/components/OperationsList/AddressCell";
import { State } from "~/renderer/reducers";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";

const NFTViewerDrawerContainer = styled.div`
  flex: 1;
  overflow-y: hidden;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  ::-webkit-scrollbar {
    display: none;
  }
`;
const NFTViewerDrawerContent = styled.div`
  padding: 0px 40px;
  padding-top: 53px;
  display: flex;
  flex-direction: column;
`;
const Pre = styled.span`
  white-space: pre-line;
  display: block;
  unicode-bidi: embed;
  word-break: break-word;
  line-height: 15px;
`;

type StickyWrapperProps = { transparent?: boolean } & PositionProps & LayoutProps & SpaceProps;
const StickyWrapper = styled.div<StickyWrapperProps>`
  background: ${({ theme, transparent }) =>
    transparent
      ? "transparent"
      : `linear-gradient(${theme.colors.palette.background.paper} 0%, ${theme.colors.palette.background.paper}90 75%, transparent 100%);`};
  position: sticky;
  ${position};
  ${layout};
  ${space}
  z-index: 1;
`;
const NFTActions = styled.div`
  display: flex;
  flex-direction: row;
  margin: 12px 0px;
  justify-content: center;
`;
const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.colors.palette.text.shade10};
  margin: 24px 0px;
`;
const NFTAttributes = styled.div`
  margin: 24px 0px;
  display: flex;
  flex-direction: column;
`;
const NFTImageContainer = styled.div`
  position: relative;
  cursor: ${({ contentType }: { contentType: string | undefined }) =>
    contentType === "image" ? "pointer" : "initial"};
`;
const NFTImageOverlay = styled.div`
  opacity: 0;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  &:hover {
    opacity: 1;
  }
`;
const HashContainer = styled.div`
  word-break: break-all;
  user-select: text;
  width: 100%;
  min-width: 100px;
  user-select: none;
`;
const NFTAttribute = memo(
  ({
    title,
    value,
    skeleton,
    separatorBottom,
    separatorTop,
  }: {
    title: string;
    value: React.ReactNode | string;
    skeleton?: boolean;
    separatorBottom?: boolean;
    separatorTop?: boolean;
  }) => {
    if (!skeleton && !value) return null;
    return (
      <>
        {separatorTop ? <Separator /> : null}
        <Text
          mb={1}
          lineHeight="15.73px"
          fontSize={4}
          color="palette.text.shade60"
          ff="Inter|SemiBold"
        >
          {title}
        </Text>
        <Skeleton show={skeleton} width={120} minHeight={24} barHeight={10}>
          <Text lineHeight="15.73px" fontSize={4} color="palette.text.shade100" ff="Inter|Regular">
            <Pre>{value}</Pre>
          </Text>
        </Skeleton>
        {separatorBottom ? <Separator /> : null}
      </>
    );
  },
);
NFTAttribute.displayName = "NFTAttribute";
type NFTViewerDrawerProps = {
  account: Account;
  nftId: string;
  isOpen: boolean;
  height?: number;
  onRequestClose?: () => void;
};
const NFTViewerDrawer = ({ account, nftId, height }: NFTViewerDrawerProps) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // FIXME Need some memoized selector here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const protoNft =
    useSelector((state: State) =>
      getNFTById(state, {
        nftId,
      }),
    ) || ({} as ProtoNFT); // This seems really wrong to fallback to an empty object here…
  const { status: collectionStatus, metadata: collectionMetadata } = useNftCollectionMetadata(
    protoNft.contract,
    protoNft.currencyId,
  );
  const { status: nftStatus, metadata } = useNftMetadata(
    protoNft.contract,
    protoNft.tokenId,
    protoNft.currencyId,
  );
  const loading = useMemo(
    () => nftStatus === "loading" || collectionStatus === "loading",
    [collectionStatus, nftStatus],
  );
  const contentType = useMemo(
    () => getMetadataMediaType(metadata as NFTMetadata, "big"),
    [metadata],
  );
  const currency = useMemo(() => getCryptoCurrencyById(protoNft.currencyId), [protoNft.currencyId]);
  const name = (metadata && "nftName" in metadata && metadata.nftName) || protoNft.tokenId;

  const { isLoading: floorPriceLoading, data } = useNftFloorPrice(protoNft, currency);

  const ticker = data?.ticker || "";
  const floorPrice = data?.value.toString() || null;

  const onNFTSend = useCallback(() => {
    setDrawer();
    dispatch(
      openModal("MODAL_SEND", {
        account,
        isNFTSend: true,
        nftId,
      }),
    );
  }, [dispatch, nftId, account]);

  const [isPanAndZoomOpen, setPanAndZoomOpen] = useState(false);
  const openNftPanAndZoom: React.MouseEventHandler<HTMLDivElement> = useCallback(() => {
    setPanAndZoomOpen(true);
  }, [setPanAndZoomOpen]);
  const closeNftPanAndZoom = useCallback(() => {
    setPanAndZoomOpen(false);
  }, [setPanAndZoomOpen]);
  return (
    <Box height={height}>
      {isPanAndZoomOpen && metadata && (
        <NftPanAndZoom
          metadata={metadata as NFTMetadata}
          tokenId={protoNft.tokenId}
          onClose={closeNftPanAndZoom}
        />
      )}
      <NFTViewerDrawerContainer>
        <NFTViewerDrawerContent>
          <StickyWrapper top={0} pb={3} pt="24px">
            <Text
              ff="Inter|SemiBold"
              fontSize={5}
              lineHeight="18px"
              color="palette.text.shade50"
              pb={2}
            >
              <Skeleton show={loading} width={100} barHeight={10} minHeight={24}>
                {collectionMetadata?.tokenName || "-"}
              </Skeleton>
            </Text>
            <Text
              data-testid="nft-name-sendDrawer"
              ff="Inter|SemiBold"
              fontSize={7}
              lineHeight="29px"
              color="palette.text.shade100"
              style={{
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                display: "-webkit-box",
                wordWrap: "break-word",
                hyphens: "auto",
              }}
              uppercase
            >
              {name}
            </Text>
          </StickyWrapper>
          <Skeleton show={loading} width={393}>
            <NFTImageContainer
              contentType={contentType}
              onClick={contentType === "image" ? openNftPanAndZoom : undefined}
            >
              <Media
                metadata={metadata as NFTMetadata}
                tokenId={protoNft.tokenId}
                mediaFormat="big"
                full
                square={false}
                maxHeight={700}
              />
              {contentType === "image" ? (
                <NFTImageOverlay>
                  <ZoomInIcon color="white" />
                </NFTImageOverlay>
              ) : null}
            </NFTImageContainer>
          </Skeleton>
          <NFTActions>
            <Button
              data-testid="nft-send-button-sendDrawer"
              style={{
                flex: 1,
                justifyContent: "center",
              }}
              mr={4}
              primary
              onClick={onNFTSend}
              center
            >
              <IconSend size={12} />
              <Text ml={1} fontSize={3} lineHeight="18px">
                {t("NFT.viewer.actions.send")}
              </Text>
            </Button>

            <ExternalViewerButton
              nft={protoNft}
              account={account}
              metadata={metadata as NFTMetadata}
            />
          </NFTActions>
          <NFTAttributes>
            <NFTProperties metadata={metadata as NFTMetadata} status={status} />
            <NFTAttribute
              skeleton={loading}
              title={t("NFT.viewer.attributes.description")}
              value={(metadata as NFTMetadata)?.description}
              separatorBottom
            />
            <Text
              mb="6px"
              lineHeight="15.73px"
              fontSize={4}
              color="palette.text.shade60"
              fontWeight="600"
            >
              {t("NFT.viewer.attributes.tokenAddress")}
            </Text>
            <Text lineHeight="15.73px" fontSize={4} color="palette.text.shade100" fontWeight="600">
              <CopiableField value={protoNft.contract}>
                <HashContainer>
                  <SplitAddress value={protoNft.contract} ff="Inter|Regular" />
                </HashContainer>
              </CopiableField>
            </Text>
            <Separator />
            <Text
              mb={1}
              lineHeight="15.73px"
              fontSize={4}
              color="palette.text.shade60"
              fontWeight="600"
            >
              {t("NFT.viewer.attributes.tokenId")}
            </Text>
            <Text lineHeight="15.73px" fontSize={4} color="palette.text.shade100">
              <CopiableField value={protoNft.tokenId}>
                {
                  // only needed for very long tokenIds but works with any length > 4
                  protoNft.tokenId?.length >= 4 ? (
                    <HashContainer>
                      <SplitAddress value={protoNft.tokenId} />
                    </HashContainer>
                  ) : (
                    protoNft.tokenId
                  )
                }
              </CopiableField>
            </Text>
            {protoNft.standard === "ERC1155" ? (
              <React.Fragment>
                <NFTAttribute
                  separatorTop
                  skeleton={loading}
                  title={t("NFT.viewer.attributes.quantity")}
                  value={protoNft.amount.toString()}
                />
              </React.Fragment>
            ) : null}
            <FeatureToggle featureId="counterValue">
              {!floorPriceLoading && floorPrice ? (
                <NFTAttribute
                  separatorTop
                  skeleton={floorPriceLoading}
                  title={t("NFT.viewer.attributes.floorPrice")}
                  value={
                    <Text
                      mb={1}
                      data-testid="nft-floor-price"
                      lineHeight="15.73px"
                      fontSize={4}
                      color="palette.text.shade60"
                    >
                      {floorPrice} {ticker}
                    </Text>
                  }
                />
              ) : null}
            </FeatureToggle>
          </NFTAttributes>
        </NFTViewerDrawerContent>
      </NFTViewerDrawerContainer>
    </Box>
  );
};
export default memo<NFTViewerDrawerProps>(NFTViewerDrawer);
