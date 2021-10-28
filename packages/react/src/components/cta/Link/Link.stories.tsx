import React from "react";
import Link, { LinkProps } from "./index";
import { PlusMedium } from "../../../assets/icons";

export default {
  title: "cta/Link",
  component: Link,
  argTypes: {
    type: {
      options: ["main", "shade", "color"],
      control: {
        type: "radio",
      },
    },
    size: {
      options: ["small", "medium", "large"],
      control: {
        type: "radio",
      },
    },
    children: {
      type: "text",
    },
    iconPosition: {
      options: ["right", "left"],
      control: {
        type: "radio",
      },
    },
    disabled: {
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
