import { Box, InfiniteLoader } from "@ledgerhq/native-ui";
import React from "react";
import styled from "styled-components/native";

type Props = {
  color: { topLeft: string; bottomRight: string };
  selected: boolean;
  loading?: boolean;
};

const Container = styled(Box).attrs((p: { selected: boolean }) => ({
  height: 50,
  width: 50,
  borderRadius: "4px",
  marginLeft: "2px",
  marginRight: "2px",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: p.selected ? 2 : 0,
  borderColor: p.selected ? "#FFFFFF" : "neutral.c40",
}))<{ selected: boolean }>``;

const ContrastOption = styled(Box).attrs({
  borderRadius: "4px",
  height: 48,
  width: 48,
  overflow: "hidden",
})``;

const Triangle = styled(Box).attrs({
  width: 0,
  height: 0,
  backgroundColor: "transparent",
  borderRightWidth: 48,
  borderTopWidth: 48,
  borderRightColor: "transparent",
})``;

const ContrastChoice: React.FC<Props> = ({ loading, selected, color }) => (
  <Container selected={selected}>
    {selected && loading ? (
      <InfiniteLoader size={28} />
    ) : (
      <ContrastOption backgroundColor={color.bottomRight}>
        <Triangle borderTopColor={color.topLeft} />
      </ContrastOption>
    )}
  </Container>
);

export default ContrastChoice;
