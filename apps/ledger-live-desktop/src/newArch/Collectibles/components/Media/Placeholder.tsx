import React, { memo } from "react";
import { PlaceholderProps } from "LLD/Collectibles/types/Media";
import styled from "styled-components";
import Fallback from "./Fallback.png";

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

const PlaceholderComponent: React.FC<PlaceholderProps> = () => <StyledPlaceholder />;

PlaceholderComponent.displayName = "Placeholder";

export const Placeholder = memo<PlaceholderProps>(PlaceholderComponent);
