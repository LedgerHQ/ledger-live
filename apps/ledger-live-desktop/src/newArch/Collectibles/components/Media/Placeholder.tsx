import React, { memo } from "react";
import { PlaceholderProps } from "LLD/Collectibles/types/Media";
import styled from "styled-components";
import { centerEllipsis } from "~/renderer/styles/helpers";
import Fallback from "./Fallback.png";
import { NFTMetadata } from "@ledgerhq/types-live";

const StyledPlaceholder = styled.div<{ tokenId?: string; full?: boolean; metadata?: NFTMetadata }>`
  background-image: url('${Fallback}');
  background-size: cover;
  background-repeat: no-repeat;
  border-radius: 4px;
  width: 100%;
  height: 100%;
  position: relative;
  aspect-ratio: 1.3 ;

  &:after {
    display: ${p => (p.full ? "flex" : "none")}
    content: "${p => p?.metadata?.nftName || centerEllipsis(p?.tokenId || "-")}";
    font-size: 16px;
    font-size: 1vw;
    color: #fff;
    padding: 0.1vh;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: "Inter", Arial;
    font-weight: 600;
    width: 100%;
    height: 100%;
  }
`;

const PlaceholderComponent: React.FC<PlaceholderProps> = ({ metadata, tokenId }) => (
  <StyledPlaceholder metadata={metadata} tokenId={tokenId} />
);

PlaceholderComponent.displayName = "Placeholder";

export const Placeholder = memo<PlaceholderProps>(PlaceholderComponent);
