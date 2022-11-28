import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import Text from "../../../src/components/Text";
import { textVariants } from "../../../src/styles/theme";

storiesOf((story) =>
  story("Text", module).add("Text", () => (
    <Text
      variant={select("variant", textVariants, "h1")}
      fontWeight={select("fontWeight", ["medium", "semiBold", "bold"], "medium")}
      color={select("color", ["primary.c100", "neutral.c100"], "neutral.c100")}
      bracket={boolean("bracket", false)}
    >
      {text("label", "Ledger")}
    </Text>
  )),
);
