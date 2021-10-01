import { text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Button, { PromisableButton } from "@components/Button";
import Info from "@ui/icons/Info";
import CenterView from "../CenterView";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

storiesOf("Button", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("regular", () => (
    <Button
      type={select("type", ["main", "error", "color", undefined], undefined)}
      size={select("size", ["small", "medium", "large", undefined], undefined)}
      iconPosition={select("iconPosition", ["right", "left"], "right")}
      Icon={select("Icon", [Info, undefined], undefined)}
      disabled={boolean("disabled", false)}
      outline={boolean("outline", false)}
      onPress={action("onPress")}
    >
      {text("label", "Ledger")}
    </Button>
  ))
  .add("PromisableButton", () => (
    <PromisableButton
      type={select("type", ["primary", "secondary", undefined], undefined)}
      iconPosition={select("iconPosition", ["right", "left"], "right")}
      Icon={select("Icon", [Info, undefined], undefined)}
      disabled={boolean("disabled", false)}
      onPress={async () => await delay(3000)}
    >
      {text("label", "Ledger")}
    </PromisableButton>
  ));
