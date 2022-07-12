import React from "react";
import styled from "styled-components";
import { Flex } from "@ledgerhq/react-ui";

const SeparatorContainer = styled(Flex).attrs({
  flexDirection: "row",
  alignItems: "center",
  padding: "40px 0px",
  width: "100%",
})``;

const SeparatorLine = styled(Flex).attrs({
  backgroundColor: "neutral.c40",
  height: "1px",
  flex: 1,
})``;

interface SeparatorProps {
  label: string;
}

export function Separator({ label }: SeparatorProps) {
  return (
    <SeparatorContainer>
      <SeparatorLine />
    </SeparatorContainer>
  );
}
