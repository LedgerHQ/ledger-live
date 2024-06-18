import React, { memo } from "react";
import { PlaceholderProps } from "LLD/Collectibles/types/Media";
import styled from "styled-components";
import { centerEllipsis } from "~/renderer/styles/helpers";
import Fallback from "~/renderer/images/nftFallback.jpg";

const randomHueForTokenId = (tokenId = "") => parseInt(tokenId.substr(-8)) % 360;

const StyledPlaceholder = styled.div<{
  tokenId?: PlaceholderProps["tokenId"];
  metadata?: PlaceholderProps["metadata"];
}>`
  --hue: ${p => randomHueForTokenId(p.tokenId)};
  background-image: url("${Fallback}");
  background-size: contain;
  border-radius: 4px;
  width: 100%;
	@@ -27,7 +22,6 @@ const StyledPlaceholder = styled.div<{ tokenId?: string; full?: boolean; metadat
  aspect-ratio: 1;
  &:after {
    content: "${p => p?.metadata?.nftName || centerEllipsis(p?.tokenId || "-")}";
    font-size: 16px;
    font-size: 1vw;
	@@ -42,10 +36,11 @@ const StyledPlaceholder = styled.div<{ tokenId?: string; full?: boolean; metadat
    height: 100%;
  }
`;

const PlaceholderComponent = memo<PlaceholderProps>(({ metadata, tokenId }) => (
  <StyledPlaceholder metadata={metadata} tokenId={tokenId} />
));

PlaceholderComponent.displayName = "Placeholder";

export const Placeholder = PlaceholderComponent;
