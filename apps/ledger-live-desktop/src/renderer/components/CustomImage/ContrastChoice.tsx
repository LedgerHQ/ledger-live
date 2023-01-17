import { Box, Flex } from "@ledgerhq/react-ui";
import React from "react";
import styled from "styled-components";

type Props = {
  color: { topLeft: string; bottomRight: string };
  selected: boolean;
  onClick: () => void;
  index: number;
};

type ContrastOptionProps = {
  colors: { topLeft: string; bottomRight: string };
};

const Container = styled(Flex).attrs((p: { selected: boolean }) => ({
  position: "relative",
  height: 56,
  width: 56,
  justifyContent: "center",
  alignItems: "center",
  border: "solid",
  borderWidth: 1,
  borderColor: p.selected ? "constant.white" : "neutral.c40",
  borderRadius: "4px", // 2 does not work
}))<{ selected: boolean }>``;

const ContrastOption = styled(Box).attrs({
  borderRadius: "4px",
  height: 54,
  width: 54,
  overflow: "hidden",
})<ContrastOptionProps>`
  background: linear-gradient(
    to bottom right,
    ${p => p.colors.topLeft} calc(50% - 1px),
    ${p => p.colors.bottomRight} 50%
  );
`;

const ContrastChoice: React.FC<Props> = ({ selected, color, onClick, index }) => (
  <Container
    selected={selected}
    onClick={onClick}
    data-test-id={`custom-image-contrast-option-${index}-button`}
  >
    <ContrastOption colors={color} />
  </Container>
);

export default ContrastChoice;
