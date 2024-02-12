import React, { useState } from "react";

import ChipTabs, { Props } from "./index";
import Text from "../../asorted/Text";

export default {
  title: "Tabs/Chip",
  component: ChipTabs,
  argTypes: {
    initialActiveIndex: {
      control: { type: "number" },
    },
  },
};

const navItems = ["One", "Two", "Three", "Four", "Five"];

function Sample({ children, ...args }: Props) {
  const [activeIndex, setActiveIndex] = useState(args.initialActiveIndex);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ width: "100%" }}>
        <ChipTabs {...args} onTabChange={setActiveIndex}>
          {children}
        </ChipTabs>
      </div>
      <Text variant="subtitle">Active index: {activeIndex}</Text>
      <hr />
    </div>
  );
}

export const Chip = (args: Props): React.ReactNode[] =>
  navItems.reduce<React.ReactNode[]>((acc, _, index) => {
    const labels = [
      navItems.slice(0, index + 1).map(label => (
        <Text color="inherit" variant="small">
          {label}
        </Text>
      )),
    ];
    return [
      ...acc,
      <Sample {...args} key={index}>
        {labels}
      </Sample>,
    ];
  }, []);

Chip.args = {
  initialActiveIndex: 1,
};
