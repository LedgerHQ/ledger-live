import React from "react";
import { View, ScrollView } from "react-native";
import { storiesOf } from "../storiesOf";
import { useTheme } from "styled-components/native";

import Text from "../../../src/components/Text";
import Flex from "../../../src/components/Layout/Flex";

const SpacingStory = () => {
  const theme = useTheme();
  const [, ...space] = theme.space;

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}
      style={{ width: "100%" }}
    >
      {space.map((value, index) => (
        <Flex mb={4} width="90%" key={value}>
          <Text variant="small" color={theme.colors.neutral.c100}>
            {value}
            <Text ml={4} variant="small" color="neutral.c70">
              space[{index + 1}]
            </Text>
          </Text>
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

storiesOf((story) => story("Particles", module).add("Spacing", SpacingStory));
