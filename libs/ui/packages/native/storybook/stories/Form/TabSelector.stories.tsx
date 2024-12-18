import React from "react";
import { View } from "react-native";
import TabSelector from "../../../src/components/Form/TabSelector";

export default {
  title: "Form/TabSelector",
  component: TabSelector,
  argTypes: {
    labels: { control: "array" },
    onToggle: { action: "toggled" },
  },
};

type TabSelectorStoryArgs = {
  labels: string[];
  labels2: string[];
  labels3: string[];
  labels4: string[];
  onToggle: (value: string) => void;
};

export const TabSelectorStory = (args: TabSelectorStoryArgs) => {
  const handleToggle = (value: string) => {
    args.onToggle(value);
  };

  return (
    <>
      <View style={{ padding: 20, height: 80, width: 500 }}>
        <TabSelector labels={args.labels} onToggle={handleToggle} />
      </View>
      <View style={{ padding: 20, height: 80, width: 500 }}>
        <TabSelector labels={args.labels2} onToggle={handleToggle} />
      </View>
      <View style={{ padding: 20, height: 80, width: 500 }}>
        <TabSelector labels={args.labels3} onToggle={handleToggle} />
      </View>
      <View style={{ padding: 20, height: 80, width: 500 }}>
        <TabSelector labels={args.labels4} onToggle={handleToggle} />
      </View>
    </>
  );
};

TabSelectorStory.storyName = "TabSelectorStory";

const TabSelectorStoryArgs = {
  labels: ["First tab"],
  labels2: ["First tab", "Second Tab"],
  labels3: ["First tab", "Second Tab", "Third Tab"],
  labels4: [
    "First tab First tab First tab",
    "Second Tab Second Tab Second Tab",
    "Third Tab Third Tab Third Tab",
    "Fourth Tab Fourth Tab Fourth Tab",
  ],
};

TabSelectorStory.args = TabSelectorStoryArgs;
