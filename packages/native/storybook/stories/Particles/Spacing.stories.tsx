import React from "react";
import { View, ScrollView } from "react-native";
import { storiesOf } from "../storiesOf";
import { useTheme } from "styled-components/native";

import Text from "@components/Text";
import Flex from "@components/Layout/Flex";

const SpacingStory = () => {
  const theme = useTheme();
  const [, ...space] = theme.space;

  return (
    <ScrollView
      contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}
      style={{ width: "100%" }}
    >
      {space.map((value) => (
        <Flex mb={4} width="90%" key={value}>
          <Text variant="subtitle" color={theme.colors.palette.neutral.c100}>
            {value}
          </Text>
          <View
            style={{
              height: value,
              backgroundColor: theme.colors.palette.primary.c20,
            }}
          />
        </Flex>
      ))}
    </ScrollView>
  );
};

storiesOf((story) => story("Particles", module).add("Spacing", SpacingStory));
