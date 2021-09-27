import React from "react";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, boolean } from "@storybook/addon-knobs";
import ScrollContainer from "../../../src/components/Layout/ScrollContainer";
import CenterView from "../CenterView";
import { View } from "react-native";
import { action } from "@storybook/addon-actions";

const Element = ({ isEven = false }: { isEven?: boolean }) => (
  <View
    style={{
      backgroundColor: isEven ? "orange" : "blue",
      width: 200,
      height: 200,
    }}
  />
);

/*
 ** TODO: use react-native-reanimated hooks to generate onScroll
 ** value once the configuration will be fix to allow using
 ** hooks from our stories
 */
const ScrollContainerStory = () => (
  <ScrollContainer
    contentContainerStyle={{ flex: 1 }}
    horizontal={boolean("Horizontal", false)}
    onScroll={action("scroll")}
  >
    {Array(20)
      .fill(0)
      .map((_, i) => (
        <Element isEven={i % 2 === 0} key={i} />
      ))}
  </ScrollContainer>
);

storiesOf("Layout", module)
  .addDecorator(withKnobs)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add("ScrollContainer", ScrollContainerStory);
