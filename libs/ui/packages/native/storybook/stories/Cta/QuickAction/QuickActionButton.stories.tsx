import { storiesOf } from "../../storiesOf";
import { select, boolean, text } from "@storybook/addon-knobs";
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

const iconOptions = {
  PlusMedium,
  LendMedium,
  ArrowBottomMedium,
  MinusMedium,
  ArrowTopMedium,
  DelegateMedium,
};
const iconSelect = () =>
  iconOptions[
    select(
      "Icon",
      [
        "PlusMedium",
        "LendMedium",
        "ArrowBottomMedium",
        "MinusMedium",
        "ArrowTopMedium",
        "DelegateMedium",
      ],
      "PlusMedium",
    )
  ];

const Regular = (): JSX.Element => (
  <QuickActionButton
    Icon={iconSelect()}
    disabled={boolean("disabled", false)}
    onPress={action("onPress")}
    onPressWhenDisabled={
      boolean("onPressWhenDisabled", false) ? action("onPressWhenDisabled") : undefined
    }
  >
    {text("label", "Sell")}
  </QuickActionButton>
);

storiesOf((story) => story("CTA/QuickAction", module).add("Button", Regular));
