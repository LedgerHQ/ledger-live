import { text } from "@storybook/addon-knobs";
import { storiesOf } from "../storiesOf";
import { select, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import React from "react";
import Link from "@components/cta/Link";
import Info from "@ui/icons/Info";
import FlexBox from "@ui/components/Layout/Flex";

export const Regular = () => (
  <FlexBox
    style={{
      padding: 20,
    }}
    backgroundColor={
      boolean("reversed", false)
        ? "palette.neutral.c100"
        : "palette.neutral.c00"
    }
  >
    <Link
      type={select("type", ["main", "shade", "color", undefined], undefined)}
      size={select("size", ["small", "medium", "large", undefined], undefined)}
      iconPosition={select("iconPosition", ["right", "left"], "right")}
      Icon={select("Icon", [Info, undefined], undefined)}
      disabled={boolean("disabled", false)}
      reversed={boolean("reversed", false)}
      onPress={action("onPress")}
    >
      {text("label", "Ledger")}
    </Link>
  </FlexBox>
);

storiesOf((story) => story("Link", module).add("Regular", Regular));
