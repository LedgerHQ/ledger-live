import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import styled, { useTheme } from "styled-components/native";
type Props = {
  title: string;
  desc?: string;
  mainButton: {
    label: string;
    onPress: () => void;
    outline: boolean;
  };
};

export function ErrorComponent({ title, desc, mainButton }: Props) {
  const { colors } = useTheme();
  return (
    <Flex flexDirection="column" pb={7}>
      <Flex flexDirection="column" alignItems="center" justifyContent="center">
        <Container borderRadius={50}>
          <Icons.DeleteCircleFill size={"L"} color={colors.error.c60} />
        </Container>
        <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold" mt={7}>
          {title}
        </Text>
        {desc && (
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" mt={6}>
            {desc}
          </Text>
        )}
      </Flex>
      <Flex mt={8}>
        <Button type="main" outline={mainButton.outline} onPress={mainButton.onPress}>
          {mainButton.label}
        </Button>
      </Flex>
    </Flex>
  );
}

const Container = styled(Box)`
  background-color: ${p => p.theme.colors.opacityDefault.c05};

  height: 72px;
  width: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
`;
