import React from "react";
import styled from "styled-components";
import Flex, { FlexBoxProps } from "../../layout/Flex";
import Text from "../../asorted/Text";

export type Props = FlexBoxProps & { text?: string };
const DividerBase = styled(Flex).attrs<FlexBoxProps>((p: FlexBoxProps) => ({
  my: p.my || 0,
  height: 1,
  backgroundColor: "neutral.c40",
}))`
  &[data-variant="light"] {
    background: ${p => p.theme.colors.neutral.c30};
  }
`;

const Divider: React.FC<Props> = props => {
  if (!props.text) return <DividerBase {...props} />;
  return (
    <Flex {...props} flexDirection="row" alignItems="center">
      <DividerBase my={6} flex={1} />
      <Text variant="bodyLineHeight" color="neutral.c60" mx={6}>
        {props.text}
      </Text>
      <DividerBase my={6} flex={1} />
    </Flex>
  );
};

export default Divider;
