import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import Text from "../../../src/components/Text";

storiesOf((story) =>
  story("Text", module).add("Text", () => (
    <Text
      variant={select(
        "variant",
        [
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "large",
          "body",
          "bodyLineHeight",
          "paragraph",
          "paragraphLineHeight",
          "small",
          "subtitle",
          "tiny",
        ],
        "h1",
      )}
      fontWeight={select("fontWeight", ["medium", "semiBold", "bold"], "medium")}
      color={select("color", ["primary.c100", "neutral.c100"], "neutral.c100")}
      bracket={boolean("bracket", false)}
    >
      {text("label", "Ledger")}
    </Text>
  )),
);
