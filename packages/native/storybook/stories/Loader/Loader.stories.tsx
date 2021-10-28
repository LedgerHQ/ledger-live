import React from "react";
import { storiesOf } from "../storiesOf";
import { number } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Loader from "@components/Loader";
import { Icons } from "../../../src/assets";

const LoaderSample = () => (
  <Loader
    progress={number("progress", 0.2)}
    onPress={action("onPress")}
    Icon={Icons.StarSolidMedium}
  />
);

storiesOf((story) => story("Loader", module).add("default", LoaderSample));
