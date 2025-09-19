import styled, { keyframes } from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";
import { ComponentType, HTMLAttributes, RefAttributes } from "react";

const fadeInOut = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

export const StyledLink = styled(Text).attrs({ fontSize: "inherit" })`
  text-decoration: underline;
  cursor: pointer;
`;

export const WelcomeContainer: ComponentType<
  HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
> = styled(Flex).attrs({
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  position: "relative",
})`
  overflow: hidden;
`;

export const VideoBackground = styled.video<{ isActive: boolean; isFull: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: ${props => (props.isActive ? "1" : "0")};
  transition: opacity 0.2s ease-in-out ${props => (props.isFull ? "0.1s" : "0s")};
`;

export const ContentOverlay: ComponentType<HTMLAttributes<HTMLDivElement>> = styled(Flex).attrs({
  flexDirection: "column",
  height: "100%",
  width: "100%",
  position: "relative",
})`
  z-index: 1;
  background: rgba(0, 0, 0, 0.3);
`;

export const TopSection: ComponentType<HTMLAttributes<HTMLDivElement>> = styled(Flex).attrs({
  flexDirection: "column",
  rowGap: "16px",
  alignItems: "center",
  p: "40px",
})``;

export const ProgressBarsContainer: ComponentType<HTMLAttributes<HTMLDivElement>> = styled(
  Flex,
).attrs({
  flexDirection: "row",
  columnGap: "4px",
  width: "300px",
})``;

export const ProgressBar = styled.div<{
  isActive: boolean;
  isFull: boolean;
  transitionDuration: number;
}>`
  height: 3px;
  flex: 1;
  background: ${props =>
    props.isFull ? props.theme.colors.neutral.c100 : props.theme.colors.neutral.c30};
  border-radius: 2px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: ${props => props.theme.colors.neutral.c100};
    border-radius: 2px;
    opacity: ${props => (props.isFull || !props.isActive ? "0" : "1")};
    width: ${props => (props.isActive ? "100%" : "0%")};
    transition: width ${props => props.transitionDuration}s linear;
  }
`;

export const TitleText = styled(Text).attrs({
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center",
  maxWidth: "600px",
  letterSpacing: "-0.05em",
})`
  animation: ${fadeInOut} 1s ease-in-out;
`;

export const BottomSection: ComponentType<HTMLAttributes<HTMLDivElement>> = styled(Flex).attrs({
  flexDirection: "column",
  alignItems: "center",
  p: "40px",
  rowGap: "16px",
})``;

export const TermsAndConditionsText = styled(Text).attrs({
  textAlign: "center",
  overflowWrap: "normal",
  whiteSpace: "pre-line",
  fontSize: "12px",
  opacity: 0.8,
})``;
