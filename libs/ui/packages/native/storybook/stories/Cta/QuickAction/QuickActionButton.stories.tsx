import { action } from "@storybook/addon-actions";
import React from "react";
import {
  PlusMedium,
  LendMedium,
  ArrowBottomMedium,
  MinusMedium,
  ArrowTopMedium,
  DelegateMedium,
} from "@ledgerhq/icons-ui/native";
import QuickActionButton from "../../../../src/components/cta/QuickAction/QuickActionButton";

export default {
  title: "CTA/QuickAction/Button",
  component: QuickActionButton,
};

const iconOptions = {
  PlusMedium,
  LendMedium,
  ArrowBottomMedium,
  MinusMedium,
  ArrowTopMedium,
  DelegateMedium,
};

export const Regular = (args: typeof RegularArgs): JSX.Element => (
  <QuickActionButton
    Icon={iconOptions[args.iconOption]}
    disabled={args.disabled}
    onPress={action("onPress")}
    onPressWhenDisabled={args.onPressWhenDisabled ? action("onPressWhenDisabled") : undefined}
  >
    {args.label}
  </QuickActionButton>
);
Regular.storyName = "QuickActionButton";
const RegularArgs = {
  iconOption: "PlusMedium" as keyof typeof iconOptions,
  disabled: false,
  onPressWhenDisabled: false,
  label: "Sell",
};
Regular.args = RegularArgs;
Regular.argTypes = {
  iconOption: {
    options: [
      "PlusMedium",
      "LendMedium",
      "ArrowBottomMedium",
      "MinusMedium",
      "ArrowTopMedium",
      "DelegateMedium",
    ],
    control: {
      type: "select",
    },
  },
};
