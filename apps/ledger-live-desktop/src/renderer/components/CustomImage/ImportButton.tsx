import React from "react";
import styled, { useTheme } from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";

type Props = {
  text: string;
  children?: React.ReactNode | undefined;
  Icon: React.ComponentType<{ size: number; color: string }>;
  onClick?: () => void;
  testId?: string;
};

const Container = styled(Flex).attrs({
  position: "relative",
  px: 8,
  py: 10,
  borderRadius: 3,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
})`
  cursor: pointer;
`;

const ImportButton: React.FC<Props> = props => {
  const { text, children, Icon, onClick, testId } = props;
  const { colors } = useTheme();

  return (
    <Container bg={colors.opacityDefault.c05} onClick={onClick} data-test-id={testId}>
      <Text variant="large" fontWeight="semiBold">
        {text}
      </Text>
      {children}
      <Flex bg={colors.opacityDefault.c05} borderRadius={999} padding={5}>
        <Icon color="primary.c80" size={24} />
      </Flex>
    </Container>
  );
};

export default ImportButton;
