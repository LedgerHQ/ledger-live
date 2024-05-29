import React, { ReactElement } from "react";
import { CollectionName, DetailField, Tag, Title, MediaContainer } from "./components";
import { NftPanAndZoom } from "./components/NftPanAndZoom";
import { Media } from "LLD/Collectibles/components";
import { SideDrawer } from "~/renderer/components/SideDrawer";
import styled from "styled-components";
import { PositionProps, LayoutProps, SpaceProps, position, layout, space } from "styled-system";
import { NFTMetadata } from "@ledgerhq/types-live";
import { DetailDrawerProps } from "LLD/Collectibles/types/DetailDrawer";

type ChildComponentProps = {
  children: ReactElement;
};

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
  padding: 40px 40px;
  padding-top: 53px;
  display: flex;
  flex-direction: column;
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

const Subtitle: React.FC<ChildComponentProps> = ({ children }) => children;
const Ctas: React.FC<ChildComponentProps> = ({ children }) => children;

const DetailDrawerComponent: React.FC<DetailDrawerProps> & {
  Subtitle: typeof Subtitle;
  Ctas: typeof Ctas;
} = ({
  children,
  collectionName,
  title,
  tags,
  details,
  isOpened,
  areFieldsLoading,
  metadata,
  protoNft,
  contentType,
  isPanAndZoomOpen,
  openCollectiblesPanAndZoom,
  closeCollectiblesPanAndZoom,
  handleRequestClose,
}) => {
  const { subtitle, ctas } = React.useMemo(() => {
    let subtitle, ctas;

    React.Children.map(children, child => {
      if (React.isValidElement(child)) {
        if (child.type === Subtitle) {
          subtitle = child;
        } else if (child.type === Ctas) {
          ctas = child;
        }
      }
    });
    return { subtitle, ctas };
  }, [children]);

  return (
    <SideDrawer
      withPaddingTop
      isOpen={isOpened}
      direction={"left"}
      onRequestClose={handleRequestClose}
      forceDisableFocusTrap
    >
      {isPanAndZoomOpen && metadata && (
        <NftPanAndZoom
          metadata={metadata as NFTMetadata}
          tokenId={protoNft.tokenId}
          onClose={closeCollectiblesPanAndZoom}
        />
      )}
      <NFTViewerDrawerContainer>
        <NFTViewerDrawerContent>
          <StickyWrapper top={0} pb={3} pt="24px">
            <CollectionName text={collectionName} isLoading={areFieldsLoading} />
            <Title text={title} isLoading={areFieldsLoading} />
          </StickyWrapper>
          {subtitle}
          <MediaContainer
            contentType={contentType}
            openNftPanAndZoom={contentType === "image" ? openCollectiblesPanAndZoom : undefined}
            isMediaLoaded={areFieldsLoading}
          >
            <Media
              metadata={metadata as NFTMetadata}
              tokenId={protoNft.tokenId}
              mediaFormat="big"
              full
              square={false}
              maxHeight={700}
            />
          </MediaContainer>
          {ctas}
          <Tag tags={tags} sectionTitle="Tag" status="" />
          {details.map(({ key, value, title, isCopyable, isHash }, index) => (
            <DetailField
              key={key + value}
              label={title}
              value={value}
              isLoading={areFieldsLoading}
              hasSeparatorBottom={index !== details.length - 1}
              isCopyable={isCopyable}
              isHash={isHash}
            />
          ))}
        </NFTViewerDrawerContent>
      </NFTViewerDrawerContainer>
    </SideDrawer>
  );
};

DetailDrawerComponent.Subtitle = Subtitle;
DetailDrawerComponent.Ctas = Ctas;

export const DetailDrawer = DetailDrawerComponent;
