import React from "react";
import { storiesOf } from "../storiesOf";
import { number } from "@storybook/addon-knobs";
import { action } from "@storybook/addon-actions";
import Loader from "@components/Loader";
import Icon from "@ui/assets/icons/StarSolidMedium";

const LoaderSample = () => (
  <Loader
    progress={number("progress", 0.2)}
    onPress={action("onPress")}
    Icon={Icon}
  />
);

storiesOf((story) => story("Loader", module).add("default", LoaderSample));
