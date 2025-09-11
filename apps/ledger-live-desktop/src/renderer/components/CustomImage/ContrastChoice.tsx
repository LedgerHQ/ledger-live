import { Box, Flex } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";
import { Appearance } from "./dithering/types";

type Props = {
  selected: boolean;
  onClick: () => void;
  index: number;
  appearance: Appearance;
};

type ContainerProps = {
  selected: boolean;
  appearanceType: Appearance["type"];
};

const Container = styled(Flex).attrs((p: ContainerProps) => ({
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
  border: "solid",
  height: p.appearanceType === "two-colors" ? 48 : 56,
  width: p.appearanceType === "two-colors" ? 48 : 56,
  borderWidth: p.appearanceType === "two-colors" ? 1 : 2,
  padding: p.appearanceType === "two-colors" ? 0 : 2,
  borderColor: p.selected ? "neutral.c100" : "transparent",
  borderRadius: p.appearanceType === "two-colors" ? "5px" : "8px",
}))<ContainerProps>``;

const ContrastOptionColors = styled(Box).attrs({
  borderRadius: "4px",
  height: 46,
  width: 46,
  overflow: "hidden",
})<{ colors: { topLeft: string; bottomRight: string } }>`
  background: linear-gradient(
    to bottom right,
    ${p => p.colors.topLeft} calc(50% - 1px),
    ${p => p.colors.bottomRight} 50%
  );
`;

const ContrastOptionBackgroundPicture = styled(Box).attrs({
  borderRadius: "4px",
  height: 48,
  width: 48,
  overflow: "hidden",
})<{ backgroundSrc: string }>`
  background-image: url(${p => p.backgroundSrc});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
`;

const ContrastChoice: React.FC<Props> = ({ selected, appearance, onClick, index }) => (
  <Container
    selected={selected}
    onClick={onClick}
    appearanceType={appearance.type}
    data-testid={`custom-image-contrast-option-${index}-button`}
  >
    {appearance.type === "two-colors" && (
      <ContrastOptionColors
        colors={{ topLeft: appearance.topLeftColor, bottomRight: appearance.bottomRightColor }}
      />
    )}
    {appearance.type === "background-picture" && (
      <ContrastOptionBackgroundPicture backgroundSrc={appearance.backgroundPicSrc} />
    )}
  </Container>
);

export default ContrastChoice;
