import React, { ReactNode } from "react";
import styled from "styled-components/native";
import { TextStyle } from "react-native";
import { Text } from "../../../components";

const Wrapper = styled.View<{ $spacing: "sm" | "md" }>`
  border-radius: 4px;
  background-color: ${(props) => props.theme.colors.neutral.c30};
  flex-shrink: 0;
  align-self: flex-start;
  padding: ${(props) => (props.$spacing === "sm" ? "1px 4px" : "2px 6px")};
`;

export const Tag = ({
  textTransform = "none",
  children,
  spacing = "sm",
}: {
  textTransform?: TextStyle["textTransform"];
  children: ReactNode;
  spacing?: "sm" | "md";
}) => {
  return (
    <Wrapper testID="tag" $spacing={spacing}>
      <Text color="neutral.c70" fontSize="10px" lineHeight="16px" textTransform={textTransform}>
        {children}
      </Text>
    </Wrapper>
  );
};
