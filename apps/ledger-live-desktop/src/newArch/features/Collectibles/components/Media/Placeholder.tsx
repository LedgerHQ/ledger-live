import React, { memo } from "react";
import styled from "styled-components";
import Fallback from "./Fallback.png";
import { Box } from "@ledgerhq/react-ui";

const StyledPlaceholder = styled.div`
  background-image: url("${Fallback}");
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 4px;
  width: 100%;
  height: 100%;
  position: relative;
  aspect-ratio: 1.4;
`;

type Props = {
  size?: number;
};

const PlaceholderComponent: React.FC<Props> = ({ size }) => (
  <Box size={size}>
    <StyledPlaceholder />
  </Box>
);

PlaceholderComponent.displayName = "Placeholder";

export const Placeholder = memo(PlaceholderComponent);
