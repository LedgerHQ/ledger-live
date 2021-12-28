import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Link from "../../../src/components/cta/Link";
import { InfoMedium } from "@ledgerhq/icons-ui/native";

const Regular = () => (
  <Link
    type={select("type", ["main", "shade", "color", undefined], undefined)}
    size={select("size", ["small", "medium", "large", undefined], undefined)}
    iconPosition={select("iconPosition", ["right", "left"], "right")}
    disabled={boolean("disabled", false)}
    onPress={action("onPress")}
  >
    {text("label", "Ledger")}
  </Link>
);

const WithIcon = () => (
  <Link
    type={select("type", ["main", "shade", "color", undefined], undefined)}
    size={select("size", ["small", "medium", "large", undefined], undefined)}
    iconPosition={select("iconPosition", ["right", "left"], "right")}
    Icon={InfoMedium}
    disabled={boolean("disabled", false)}
    onPress={action("onPress")}
  >
    {text("label", "Ledger")}
  </Link>
);

storiesOf((story) => story("Link", module).add("Regular", Regular).add("Icon link", WithIcon));
