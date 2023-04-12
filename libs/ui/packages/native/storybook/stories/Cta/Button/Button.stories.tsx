import React from "react";
import { action } from "@storybook/addon-actions";
import Button, { PromisableButton } from "../../../../src/components/cta/Button";
import Info from "../../../../src/icons/Info";
import { ComponentMeta, ComponentStory } from "@storybook/react-native";
import { IconType } from "src/components/Icon/type";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default {
  title: "CTA/Button",
  component: Button,
  argTypes: {
    type: {
      options: ["main", "error", "shade", "color", undefined],
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
    Icon: {
      options: ["Info", "None"],
      control: { type: "select" },
    },
  },
} as ComponentMeta<typeof Button>;

export const Regular: ComponentStory<typeof Button> = (args: typeof RegularArgs) => (
  <Button
    {...args}
    Icon={args.Icon === "Info" ? (Info as IconType) : undefined}
    onPress={action("onPress")}
  >
    {args.label}
  </Button>
);
const RegularArgs = {
  type: "main" as const,
  size: undefined,
  iconPosition: "right" as const,
  Icon: "Info",
  iconName: "Info",
  disabled: false,
  pending: false,
  displayContentWhenPending: false,
  outline: false,
  label: "Ledger",
};
Regular.args = RegularArgs;

export const Promisable: ComponentStory<typeof Button> = (args: any) => (
  <PromisableButton
    {...args}
    Icon={args.Icon === "Info" ? Info : undefined}
    onPress={async () => await delay(3000)}
  >
    {args.label}
  </PromisableButton>
);
const PromisableArgs = {
  type: undefined,
  iconPosition: "right",
  Icon: "None",
  disabled: false,
  label: "Ledger",
};
Promisable.args = PromisableArgs;
