import React from "react";
import { storiesOf } from "../storiesOf";
import { number, color, boolean, select } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import { useTheme } from "styled-components/native";
import { Text, ProgressLoader } from "../../../src";

const LoaderSample = () => {
  const { colors } = useTheme();
  const mainColor = colors.primary.c80;
  const secondaryColor = colors.primary.c40;
  const progress = number("progress", 0.5, { min: 0, max: 1, step: 0.1 });
  return (
    <ProgressLoader
      progress={progress}
      infinite={boolean("infinite", false)}
      onPress={action("onPress")}
      mainColor={color("mainColor", mainColor)}
      secondaryColor={color("secondaryColor", secondaryColor)}
      radius={number("radius", 48)}
      strokeWidth={number("strokeWidth", 10)}
      frontStrokeLinecap={select("frontStrokeLinecap", ["butt", "round"], "butt")}
    >
      {
        <Text textAlign="center">
          (children{"\n"} {progress * 100}%)
        </Text>
      }
    </ProgressLoader>
  );
};

storiesOf((story) => story("Loader", module).add("ProgressLoader", LoaderSample));
