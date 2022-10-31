import { Box, Flex, Icons } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";

type Props = {
  color: string;
  selected: boolean;
  onClick: () => void;
  index: number;
};

const Container = styled(Flex).attrs((p: { selected: boolean }) => ({
  position: "relative",
  height: 56,
  width: 56,
  justifyContent: "center",
  alignItems: "center",
  border: "solid",
  borderWidth: p.selected ? 2 : 1,
  borderColor: p.selected ? "primary.c80" : "neutral.c40",
  borderRadius: "4px", // 2 does not work
}))<{ selected: boolean }>``;

const Round = styled(Box).attrs({
  height: 28,
  width: 28,
  borderRadius: 28,
})``;

const PillBackground = styled(Box).attrs(p => ({
  height: "20px",
  width: "20px",
  backgroundColor: p.theme.colors.v2Palette.background.paper,
}))``;

const PillForeground = styled(Icons.CircledCheckSolidMedium).attrs({
  color: "primary.c80",
  size: "20px",
})``;

const CheckContainer = styled(Box).attrs({
  position: "absolute",
  right: "-10px",
  top: "-10px",
})``;

const CheckPill: React.FC<Record<string, never>> = () => (
  <CheckContainer>
    <PillBackground>
      <PillForeground />
    </PillBackground>
  </CheckContainer>
);

const ContrastChoice: React.FC<Props> = ({ selected, color, onClick, index }) => (
  <Container
    selected={selected}
    onClick={onClick}
    data-test-id={`custom-image-contrast-option-${index}-button`}
  >
    <Round backgroundColor={color} />
    {selected && <CheckPill />}
  </Container>
);

export default ContrastChoice;
