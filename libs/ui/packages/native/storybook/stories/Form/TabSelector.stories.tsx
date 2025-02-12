import React from "react";
import { View } from "react-native";
import TabSelector from "../../../src/components/Form/TabSelector";

export default {
  title: "Form/TabSelector",
  component: TabSelector,
  argTypes: {
    labels: { control: "object" },
    onToggle: { action: "toggled" },
  },
};

type TabSelectorStoryArgs = {
  labels: { id: string; value: string }[];
  labels2: { id: string; value: string }[];
  labels3: { id: string; value: string }[];
  labels4: { id: string; value: string }[];
  onToggle: (value: string) => void;
  initialTab?: string;
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
        <TabSelector labels={args.labels2} onToggle={handleToggle} initialTab="tab2" />
      </View>
      <View style={{ padding: 20, height: 80, width: 500 }}>
        <TabSelector labels={args.labels3} onToggle={handleToggle} />
      </View>
      <View style={{ padding: 20, height: 80, width: 500 }}>
        <TabSelector labels={args.labels4} onToggle={handleToggle} initialTab="tab3" />
      </View>
    </>
  );
};

TabSelectorStory.storyName = "TabSelectorStory";

const TabSelectorStoryArgs = {
  labels: [{ id: "tab1", value: "first tab" }],
  labels2: [
    { id: "tab1", value: "first tab" },
    { id: "tab2", value: "second tab" },
  ],
  labels3: [
    { id: "tab1", value: "first tab" },
    { id: "tab2", value: "second tab" },
    { id: "tab3", value: "third tab" },
  ],
  labels4: [
    { id: "tab1", value: "first tab" },
    { id: "tab2", value: "second tab" },
    { id: "tab3", value: "third tab" },
    { id: "tab4", value: "fourth tab" },
  ],
};

TabSelectorStory.args = TabSelectorStoryArgs;
