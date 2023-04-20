import React from "react";
import { SafeAreaView } from "react-native";
import StoryBook from "./.storybook";

export default () => (
  <SafeAreaView style={{ flex: 1, marginTop: 50 }}>
    <StoryBook />
  </SafeAreaView>
);
