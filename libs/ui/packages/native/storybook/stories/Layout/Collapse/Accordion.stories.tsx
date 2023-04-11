import React, { useState } from "react";
import { Text, View } from "react-native";

import Accordion from "../../../../src/components/Layout/Collapse/Accordion";

export default {
  title: "Layout/Collapse/Accordion",
  component: Accordion,
};

export const AccordionStory = (args: typeof AccordionStoryArgs) => {
  const [collapsed, setCollapsed] = useState(true);

  const handleChange = () => setCollapsed((prev) => !prev);

  return (
    <View style={{ display: "flex", flex: 1 }}>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </Text>
      <Accordion collapsed={collapsed} title={args.title} onPress={handleChange}>
        <View style={{ height: 300, backgroundColor: "blue" }} />
      </Accordion>
      <Text>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
        laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
        voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
        cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      </Text>
    </View>
  );
};
AccordionStory.storyName = "Accordion";
const AccordionStoryArgs = {
  title: "Show 2 tokens",
};
AccordionStory.args = AccordionStoryArgs;
