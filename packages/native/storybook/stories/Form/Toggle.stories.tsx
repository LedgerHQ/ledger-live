import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Toggle from "../../../src/components/Form/Toggle";

storiesOf((story) =>
  story("Toggle", module).add("regular", () => (
    <Toggle active={boolean("active", false)} onPress={action("onPress")}>
      {text("label", "Toggle")}
    </Toggle>
  )),
);
