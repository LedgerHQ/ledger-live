import React from "react";
import { View, ScrollView } from "react-native";
import { useTheme } from "styled-components/native";

import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";
import Box from "../../../src/components/Layout/Box";

export default {
  title: "Particles/Spacing",
  component: Flex,
};

export const SpacingStory = () => {
  const theme = useTheme();
  const [, ...space] = theme.space;

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}
      style={{ width: "100%" }}
    >
      {space.map((value, index) => (
        <Flex mb={4} width="90%" key={value}>
          <Flex flexDirection="row">
            <Text variant="small" color={theme.colors.neutral.c100}>
              {value}
            </Text>
            <Box ml={2}>
              <Text variant="small" color="neutral.c70">
                space[{index + 1}]
              </Text>
            </Box>
          </Flex>
          <View
            style={{
              height: value,
              backgroundColor: theme.colors.primary.c20,
            }}
          />
        </Flex>
      ))}
    </ScrollView>
  );
};
SpacingStory.storyName = "Spacing";
