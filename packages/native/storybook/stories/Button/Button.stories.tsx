import { storiesOf } from "../storiesOf";
import { select, boolean, text } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Button, { PromisableButton } from "../../../src/components/cta/Button";
import Info from "../../../src/icons/Info";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const iconOptions = {
  Info,
  None: undefined,
};
const iconSelect = () => iconOptions[select("Icon", ["Info", "None"], "None")];
const iconName = () => text("Icon Name", "Info");

const Regular = (): JSX.Element => (
  <Button
    type={select("type", ["main", "error", "shade", "color", undefined], "main")}
    size={select("size", ["small", "medium", "large", undefined], undefined)}
    iconPosition={select("iconPosition", ["right", "left"], "right")}
    Icon={iconSelect()}
    iconName={iconName()}
    disabled={boolean("disabled", false)}
    pending={boolean("pending", false)}
    displayContentWhenPending={boolean("displayContentWhenPending", false)}
    outline={boolean("outline", false)}
    onPress={action("onPress")}
  >
    {text("label", "Ledger")}
  </Button>
);
const Promisable = (): JSX.Element => (
  <PromisableButton
    type={select("type", ["main", "shade", "error", "color", "default", undefined], undefined)}
    iconPosition={select("iconPosition", ["right", "left"], "right")}
    Icon={iconSelect()}
    disabled={boolean("disabled", false)}
    onPress={async () => await delay(3000)}
  >
    {text("label", "Ledger")}
  </PromisableButton>
);

storiesOf((story) =>
  story("Button", module).add("Regular", Regular).add("PromisableButton", Promisable),
);
