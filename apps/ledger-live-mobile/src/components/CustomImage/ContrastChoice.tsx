import { Box, InfiniteLoader } from "@ledgerhq/native-ui";
import React from "react";
import styled from "styled-components/native";
import { Appearance } from "./dithering/types";
import { Image } from "react-native";

type Props = {
  appearance: Appearance;
  selected: boolean;
  loading?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

type ContainerProps = {
  selected: boolean;
  appearance: Appearance;
};

const Container = styled(Box).attrs<ContainerProps>((p) => ({
  height: p.appearance.type === "two-colors" ? 50 : 56,
  width: p.appearance.type === "two-colors" ? 50 : 56,
  borderRadius: p.appearance.type === "two-colors" ? "5px" : "8px",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: p.selected ? 2 : 0,
  padding: p.appearance.type === "two-colors" ? 0 : 2,
  borderColor: p.selected ? "neutral.c100" : "neutral.c40",
}))<ContainerProps>``;

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

const ContrastChoice: React.FC<Props> = ({ loading, selected, appearance, isFirst, isLast }) => (
  <Container ml={isFirst ? 0 : 1} mr={isLast ? 0 : 1} selected={selected} appearance={appearance}>
    {selected && loading ? (
      <InfiniteLoader size={28} />
    ) : appearance.type === "two-colors" ? (
      <ContrastOption backgroundColor={appearance.bottomRightColor}>
        <Triangle borderTopColor={appearance.topLeftColor} />
      </ContrastOption>
    ) : (
      <ContrastOption>
        <Image style={{ width: 48, height: 48 }} source={appearance.backgroundPicSrc} />
      </ContrastOption>
    )}
  </Container>
);

export default ContrastChoice;
