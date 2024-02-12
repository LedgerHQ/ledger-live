import React from "react";
import { action } from "@storybook/addon-actions";

import { StoryTemplate } from "../../../helpers";
import WalletIcon from "@ledgerhq/icons-ui/reactLegacy/WalletMedium";
import Text from "../../../asorted/Text";
import Flex from "../../../layout/Flex";
import SideBarContext from "..";
import Item from "./Item";
import type { ItemType } from "./Item";

export default {
  title: "Navigation/SideBar/Item",
  component: Item,
  argTypes: {
    label: {
      type: "text",
      description: "Label",
      required: true,
      control: { type: "text" },
    },
    onClick: { control: false },
    children: { control: false },
    isActive: { type: "boolean" },
    isDisabled: { type: "boolean" },
    displayNotificationBadge: { type: "boolean" },
  },
};

const Template = (args: ItemType) => (
  <Flex flexDirection="column" style={{ rowGap: "1.5rem" }}>
    <Flex
      flexDirection="column"
      alignItems="flex-Start"
      style={{ width: "fit-content", rowGap: "0.5rem" }}
    >
      <Text variant="h3">Expanded</Text>
      <SideBarContext.Provider value={{ isExpanded: true, onToggle: () => {} }}>
        <Item {...args}>
          <WalletIcon />
        </Item>
      </SideBarContext.Provider>
    </Flex>

    <Flex
      flexDirection="column"
      alignItems="flex-Start"
      style={{ width: "fit-content", rowGap: "0.5rem" }}
    >
      <Text variant="h3">Collapsed</Text>
      <SideBarContext.Provider value={{ isExpanded: false, onToggle: () => {} }}>
        <Item {...args}>
          <WalletIcon />
        </Item>
      </SideBarContext.Provider>
    </Flex>
  </Flex>
);

export const Default: StoryTemplate<ItemType> = Template.bind({});
export const Hover: StoryTemplate<ItemType> = Template.bind({});
export const Focus: StoryTemplate<ItemType> = Template.bind({});
export const Active: StoryTemplate<ItemType> = Template.bind({});
export const Disable: StoryTemplate<ItemType> = Template.bind({});

Default.args = {
  label: "accounts",
  onClick: action("go to accounts"),
};
Active.args = {
  label: "accounts",
  onClick: action("go to accounts"),
  isActive: true,
};
Disable.args = {
  label: "accounts",
  onClick: action("go to accounts"),
  isDisabled: true,
};
Hover.args = {
  label: "accounts",
  onClick: action("go to accounts"),
};
Hover.parameters = { pseudo: { hover: true } };
Focus.args = {
  label: "accounts",
  onClick: action("go to accounts"),
};
Focus.parameters = { pseudo: { focus: true } };
