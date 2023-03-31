import React from "react";
import styled from "styled-components";
import { NFTMetadata } from "@ledgerhq/types-live";
import { ThemedComponent } from "~/renderer/styles/StyleProvider";
import { centerEllipsis } from "~/renderer/styles/helpers";
import Fallback from "~/renderer/images/nftFallback.jpg";
type Props = {
  metadata: NFTMetadata;
  tokenId: string;
  full?: boolean;
}; // TODO Figure out if we really need this once we know who creates/processes the media.
const StyledPlaceholder: ThemedComponent<Props> = styled.div`
  --hue: ${p => (p?.tokenId || "abcdefg").substr(-8) % 360};
  background-image: url('${Fallback}');
  background-size: contain;
  border-radius: 4px;
  width: 100%;
  height: 100%;
  position: relative;
  background-color: hsla(var(--hue), 55%, 66%, 1);
  background-blend-mode: hard-light;
  aspect-ratio: 1;

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
class Placeholder extends React.PureComponent<Props> {
  render() {
    const { metadata, tokenId } = this.props;
    return <StyledPlaceholder metadata={metadata} tokenId={tokenId} />;
  }
}
export default Placeholder;
