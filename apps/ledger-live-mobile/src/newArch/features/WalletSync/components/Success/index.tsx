import { Box, Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import React from "react";
import styled, { useTheme } from "styled-components/native";
import SafeAreaView from "~/components/SafeAreaView";
type Props = {
  title: string;
  desc?: string;
  mainButton?: {
    label: string;
    onPress: () => void;
  };

  secondaryButton: {
    label: string;
    onPress: () => void;
  };
};

export function Success({ title, desc, mainButton, secondaryButton }: Props) {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} isFlex>
      <Flex flexDirection="column" alignItems="center" justifyContent="space-between" flex={1}>
        <Flex flexDirection="column" alignItems="center" justifyContent="center" rowGap={16}>
          <Container borderRadius={50}>
            <Icons.CheckmarkCircleFill size={"L"} color={colors.success.c60} />
          </Container>
          <Text variant="h4" color="neutral.c100" textAlign="center" fontWeight="semiBold">
            {title}
          </Text>
          <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center">
            {desc}
          </Text>
        </Flex>
        <Flex flexDirection="column" rowGap={10} mb={8} width={"100%"} px={"16px"}>
          {mainButton && (
            <Button type="main" onPress={mainButton.onPress}>
              {mainButton.label}
            </Button>
          )}

          <Button type="main" outline onPress={secondaryButton.onPress}>
            {secondaryButton.label}
          </Button>
        </Flex>
      </Flex>
    </SafeAreaView>
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
