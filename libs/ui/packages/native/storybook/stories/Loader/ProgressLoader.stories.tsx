import React from "react";
import { storiesOf } from "../storiesOf";
import { number, color, boolean } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import { Icons, ProgressLoader } from "../../../src";

const LoaderSample = () => (
  <ProgressLoader
    progress={number("progress", 0.2)}
    infinite={boolean("infinite", false)}
    onPress={action("onPress")}
    mainColor={color("mainColor", "primary.c80")}
    secondaryColor={color("secondaryColor", "neutral.c40")}
    radius={number("radius", 48)}
    strokeWidth={number("strokeWidth", 4)}
  >
    <Icons.StarMedium />
  </ProgressLoader>
);

storiesOf((story) => story("Loader", module).add("ProgressLoader", LoaderSample));
