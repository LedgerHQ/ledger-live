import React, { useState } from "react";
import { View } from "react-native";
import DrawerTabSelector from "../../../src/components/Form/DrawerTabSelector";

export default {
  title: "Form/DrawerTabSelector",
  component: DrawerTabSelector,
  argTypes: {
    options: { control: "array" },
    selectedOption: { control: "text" },
    labels: { control: "object" },
  },
};

export const TabSelectorStory = (args: typeof TabSelectorStoryArgs) => {
  const [selectedOption, setSelectedOption] = useState<string | number>(args.selectedOption);

  return (
    <View style={{ padding: 20 }}>
      <DrawerTabSelector
        options={args.options}
        selectedOption={selectedOption}
        handleSelectOption={setSelectedOption}
        labels={args.labels}
      />
    </View>
  );
};

TabSelectorStory.storyName = "TabSelectorStory";

const TabSelectorStoryArgs = {
  options: ["option1", "option2"],
  selectedOption: "option1",
  labels: {
    option1: "Option 1",
    option2: "Option 2",
  },
};

TabSelectorStory.args = TabSelectorStoryArgs;
