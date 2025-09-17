import styled from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";

export const StyledLink = styled(Text)`
  text-decoration: underline;
  cursor: pointer;
`;

export const WelcomeContainer = styled(Flex).attrs({
  flexDirection: "row",
  height: "100%",
  width: "100%",
})``;

export const LeftContainer = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "space-between",
  width: "386px",
  height: "100%",
  padding: "40px",
  zIndex: 49,
})``;

export const Presentation = styled(Flex).attrs({ flexDirection: "column" })``;

export const ProductHighlight = styled(Flex).attrs({
  flexDirection: "column",
  mb: 2,
})``;

export const TermsAndConditionsContainer = styled(Flex).attrs({
  justifyContent: "center",
  flexWrap: "wrap",
  marginTop: "24px",
})``;

export const TermsAndConditionsText = styled(Text).attrs({
  flex: 1,
  color: "neutral.c80",
  textAlign: "center",
  overflowWrap: "normal",
  whiteSpace: "normal",
})``;

export const RightContainer = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%",
  overflow: "hidden",
  flexGrow: 1,
  backgroundColor: "constant.purple",
})``;

export const CarouselTopBar = styled(Flex).attrs({
  justifyContent: "flex-end",
  alignItems: "center",
  padding: "40px",
  width: "100%",
  zIndex: 1,
})``;

export const VideoWrapper = styled(Flex).attrs({
  objectFit: "cover",
  position: "fixed",
})``;

export const Description = styled(Text)`
  white-space: pre-line;
`;
