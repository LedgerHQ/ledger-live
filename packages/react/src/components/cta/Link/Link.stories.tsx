import React from "react";
import Link, { LinkProps, DEFAULT_ICON_POSITION, DEFAULT_SIZE, DEFAULT_TYPE } from "./index";
import { PlusMedium } from "@ledgerhq/icons-ui/react";

export default {
  title: "cta/Link",
  component: Link,
  parameters: { actions: { argTypesRegex: false } },
  argTypes: {
    Icon: {
      control: false,
    },
    type: {
      options: ["main", "shade", "color", undefined],
      defaultValue: DEFAULT_TYPE,
      control: {
        type: "radio",
      },
    },
    size: {
      options: ["small", "medium", "large", undefined],
      defaultValue: DEFAULT_SIZE,
      control: {
        type: "radio",
      },
    },
    children: {
      type: "text",
    },
    iconPosition: {
      defaultValue: DEFAULT_ICON_POSITION,
      options: ["left", "right", undefined],
    },
    textProps: {},
    disabled: {
      type: "boolean",
    },
    color: {
      type: "string",
      control: { control: "color" },
    },
    alwaysUnderline: {
      type: "boolean",
    },
  },
};

export const Default = ({ ...args }: LinkProps) => {
  return <Link {...args} href={"https://www.ledger.com"} />;
};

export const WithIcon = ({ ...args }: LinkProps) => {
  return <Link {...args} href={"https://www.ledger.com"} Icon={PlusMedium} />;
};

Default.args = { children: "Hello world" };
WithIcon.args = { children: "Hello world" };
