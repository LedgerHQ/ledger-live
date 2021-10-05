import { text } from "@storybook/addon-knobs";
import { storiesOf } from "@storybook/react-native";
import { withKnobs, select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Link from "@components/cta/Link";
import Info from "@ui/icons/Info";
import CenterView from "../CenterView";
import { View } from "react-native";

storiesOf("Link", module)
  .addDecorator(withKnobs)
  .addDecorator((getStory) => <CenterView>{getStory()}</CenterView>)
  .add("regular", () => (
    <View
      style={{
        backgroundColor: boolean("reversed", false) ? "black" : "white",
        padding: 20,
      }}
    >
      <Link
        type={select("type", ["main", "shade", "color", undefined], undefined)}
        size={select(
          "size",
          ["small", "medium", "large", undefined],
          undefined
        )}
        iconPosition={select("iconPosition", ["right", "left"], "right")}
        Icon={select("Icon", [Info, undefined], undefined)}
        disabled={boolean("disabled", false)}
        reversed={boolean("reversed", false)}
        onPress={action("onPress")}
      >
        {text("label", "Ledger")}
      </Link>
    </View>
  ));
