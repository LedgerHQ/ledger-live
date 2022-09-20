import { Box, Icons, InfiniteLoader } from "@ledgerhq/native-ui";
import React from "react";
import styled from "styled-components/native";

type Props = {
  color: string;
  selected: boolean;
  loading?: boolean;
};

const Container = styled(Box).attrs((p: { selected: boolean }) => ({
  height: 64,
  width: 64,
  justifyContent: "center",
  alignItems: "center",
  borderWidth: p.selected ? 2 : 1,
  borderColor: p.selected ? "primary.c80" : "neutral.c40",
  borderRadius: "4px",
}))<{ selected: boolean }>``;

const Round = styled(Box).attrs({
  height: 28,
  width: 28,
  borderRadius: 28,
})``;

const PillBackground = styled(Box).attrs({
  height: "20px",
  width: "20px",
  backgroundColor: "background.main",
})``;

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

const ContrastChoice: React.FC<Props> = ({ loading, selected, color }) => (
  <Container selected={selected}>
    {selected && loading ? (
      <InfiniteLoader size={28} />
    ) : (
      <Round backgroundColor={color} />
    )}
    {selected ? <CheckPill /> : null}
  </Container>
);

export default ContrastChoice;
