import React from "react";
import Flex, { FlexBoxProps } from "../Flex";
import styled from "styled-components/native";
import { Text } from "../../..";

const DividerBase = styled(Flex).attrs<FlexBoxProps>((p: FlexBoxProps) => ({
  my: p.my || 4,
  height: 1,
  backgroundColor: "neutral.c40",
}))``;

const Divider: React.FC<FlexBoxProps & { text?: string }> = (props) => {
  if (!props.text) return <DividerBase {...props} />;
  return (
    <Flex {...props} flexDirection="row" alignItems="center">
      <DividerBase flex={1} />
      <Text variant="bodyLineHeight" color="neutral.c60" mx={6}>
        {props.text}
      </Text>
      <DividerBase flex={1} />
    </Flex>
  );
};

export default Divider;
