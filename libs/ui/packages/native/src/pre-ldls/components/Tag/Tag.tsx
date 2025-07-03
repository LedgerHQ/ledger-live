import React, { ReactNode } from "react";
import styled from "styled-components/native";
import { Text } from "../../../components";

const Wrapper = styled.View`
  padding: 1px 4px;
  border-radius: 4px;
  background-color: ${(props) => props.theme.colors.palette.neutral.c30};
  flex-shrink: 0;
  align-self: flex-start;
`;

export const Tag = ({
  textTransform = "none",
  children,
}: {
  textTransform?: "none" | "uppercase" | "capitalize" | "lowercase";
  children: ReactNode;
}) => {
  return (
    <Wrapper testID="tag">
      <Text
        color="palette.neutral.c70"
        fontSize="10px"
        lineHeight="16px"
        textTransform={textTransform}
      >
        {children}
      </Text>
    </Wrapper>
  );
};
