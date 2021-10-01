import { text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import React from "react";
import Text from "@components/Text";
import CenterView from "../CenterView";

storiesOf("Text", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("regular", () => (
    <Text
      type={select(
        "type",
        [
          "h1",
          "h2",
          "h3",
          "highlight",
          "emphasis",
          "body",
          "cta",
          "link",
          "tiny",
          "subTitle",
          "navigation",
          "tag",
        ],
        "h1"
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
  ));
