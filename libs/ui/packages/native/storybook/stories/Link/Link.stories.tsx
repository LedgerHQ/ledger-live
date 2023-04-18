import React from "react";
import { action } from "@storybook/addon-actions";
import Link from "../../../src/components/cta/Link";
import { InfoMedium } from "@ledgerhq/icons-ui/native";

export default {
  title: "Link",
  component: Link,
  argTypes: {
    type: {
      options: ["main", "shade", "color", undefined],
      control: { type: "select" },
    },
    size: {
      options: ["small", "medium", "large", undefined],
      control: { type: "select" },
    },
    iconPosition: {
      options: ["right", "left"],
      control: { type: "select" },
    },
  },
};

export const Regular = (args: typeof RegularArgs) => (
  <Link
    type={args.type}
    size={args.size}
    iconPosition={args.iconPosition}
    disabled={args.disabled}
    onPress={action("onPress")}
  >
    {args.text}
  </Link>
);
Regular.storyName = "Link";
const RegularArgs = {
  type: undefined,
  size: undefined,
  iconPosition: "right" as const,
  disabled: false,
  text: "Ledger",
};
Regular.args = RegularArgs;

export const WithIcon = (args: typeof WithIconArgs) => (
  <Link
    type={args.type}
    size={args.size}
    iconPosition={args.iconPosition}
    Icon={InfoMedium}
    disabled={args.disabled}
    onPress={action("onPress")}
  >
    {args.text}
  </Link>
);
WithIcon.storyName = "Link (with icon)";
const WithIconArgs = {
  type: undefined,
  size: undefined,
  iconPosition: "right" as const,
  disabled: false,
  text: "Ledger",
};
WithIcon.args = WithIconArgs;
