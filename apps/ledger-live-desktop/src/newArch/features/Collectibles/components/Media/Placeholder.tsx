import React, { memo } from "react";
import styled from "styled-components";
import Fallback from "./Fallback.png";
import { Box } from "@ledgerhq/react-ui";

type StyledPlaceholderProps = {
  backgroundSize?: string;
};

const StyledPlaceholder = styled.div<StyledPlaceholderProps>`
  background-image: url("${Fallback}");
  background-repeat: no-repeat;
  background-position: center;
  background-size: ${p => (p.backgroundSize ? p.backgroundSize : "cover")};
  border-radius: 4px;
  width: 100%;
  height: 100%;
  position: relative;
  aspect-ratio: 1.4;
`;

type Props = {
  size?: number;
  backgroundSize?: string;
};

const PlaceholderComponent: React.FC<Props> = ({ size, backgroundSize = undefined }) => (
  <Box size={size}>
    <StyledPlaceholder backgroundSize={backgroundSize} />
  </Box>
);

PlaceholderComponent.displayName = "Placeholder";

export const Placeholder = memo(PlaceholderComponent);
