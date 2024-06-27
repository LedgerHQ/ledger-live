import React, { memo } from "react";
import styled from "styled-components";
import { CopyableFieldProps } from "LLD/Collectibles/types/DetailDrawer";
import { GradientHover } from "~/renderer/drawers/OperationDetails/styledComponents";
import CopyWithFeedback from "~/renderer/components/CopyWithFeedback";

const CopyableFieldContainer = styled.div`
  display: inline-flex;
  position: relative;
  max-width: 100%;

  ${GradientHover} {
    display: none;
  }

  &:hover ${GradientHover} {
    display: flex;
    & > * {
      cursor: pointer;
    }
  }
`;

const CopyableFieldComponent: React.FC<CopyableFieldProps> = ({ value, children }) => {
  return (
    <CopyableFieldContainer>
      {children}
      <GradientHover>
        <CopyWithFeedback text={value} />
      </GradientHover>
    </CopyableFieldContainer>
  );
};

CopyableFieldComponent.displayName = "CopyableField";

export const CopyableField = memo<CopyableFieldProps>(CopyableFieldComponent);
