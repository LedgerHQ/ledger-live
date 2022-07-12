import React from "react";
import styled from "styled-components";
import { Flex } from "@ledgerhq/react-ui";

const Container = styled(Flex)`
  height: 100%;
  flex: 0 0 52%;
  width: 52%;
  justify-content: center;
  align-items: center;
`;

export type StepRightSideProps = {
  AsideRight: React.ReactNode;
  rightSideBgColor?: string;
};

const StepRightSide = (props: StepRightSideProps) => {
  const { AsideRight, rightSideBgColor } = props;
  return (
    <Container backgroundColor={rightSideBgColor || "palette.primary.c60"}>{AsideRight || null}</Container>
  );
};

export default StepRightSide;
