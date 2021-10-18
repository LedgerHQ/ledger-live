import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Button, { PromisableButton } from "@components/cta/Button";
import Info from "@ui/icons/Info";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const Regular = (): JSX.Element => (
  <Button
    type={select(
      "type",
      ["main", "error", "shade", "color", undefined],
      undefined
    )}
    size={select("size", ["small", "medium", "large", undefined], undefined)}
    iconPosition={select("iconPosition", ["right", "left"], "right")}
    Icon={select("Icon", [Info, undefined], undefined)}
    disabled={boolean("disabled", false)}
    outline={boolean("outline", false)}
    onPress={action("onPress")}
  >
    {text("label", "Ledger")}
  </Button>
);

export const Promisable = (): JSX.Element => (
  <PromisableButton
    type={select("type", ["primary", "secondary", undefined], undefined)}
    iconPosition={select("iconPosition", ["right", "left"], "right")}
    Icon={select("Icon", [Info, undefined], undefined)}
    disabled={boolean("disabled", false)}
    onPress={async () => await delay(3000)}
  >
    {text("label", "Ledger")}
  </PromisableButton>
);

storiesOf((story) =>
  story("Button", module)
    .add("Regular", Regular)
    .add("PromisableButton", Promisable)
);
