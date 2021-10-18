import React from "react";
import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import Text from "@components/Text";

storiesOf((story) =>
  story("Text", module).add("regular", () => (
    <Text
      type={select(
        "type",
        [
          "h1",
          "h2",
          "h3",
          "large",
          "emphasis",
          "body",
          "link",
          "subTitle",
          "small",
          "tag",
        ],
        "h1"
      )}
      fontWeight={select(
        "fontWeight",
        ["medium", "semibold", "bold"],
        "medium"
      )}
      color={select(
        "color",
        ["palette.primary.c100", "palette.neutral.c100"],
        "palette.neutral.c100"
      )}
      bracket={boolean("bracket", false)}
    >
      {text("label", "Ledger")}
    </Text>
  ))
);
