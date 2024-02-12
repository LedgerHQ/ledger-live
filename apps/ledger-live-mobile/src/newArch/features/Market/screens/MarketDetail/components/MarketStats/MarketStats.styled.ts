import { Flex, Text } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

export const StyledStatRowContainer = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  my: 4,
})``;

export const StyledSeparator = styled(Flex).attrs({
  width: "100%",
  my: 24,
  height: 1,
  bg: "neutral.c40",
})``;

export const StyledTitle = styled(Text).attrs({
  variant: "h3",
  color: "neutral.c100",
})``;

export const StyledLabel = styled(Text).attrs({
  variant: "body",
  color: "neutral.c70",
})``;

export const StyledTextLabel = styled(Text).attrs({
  variant: "body",
  color: "neutral.c100",
})``;

export const StyledSubLabel = styled(Text).attrs({
  variant: "small",
  color: "neutral.c70",
})``;

export const StyledStatValue = styled(Flex).attrs({
  flex: 1,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "flex-end",
})``;
