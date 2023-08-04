import React from "react";
import { IconsLegacy } from "../../../src/assets";
import { IconBox } from "../../../src/components";

export default {
  title: "Icon/IconBox",
  component: IconBox,
};

export const IconBoxSample = () => <IconBox Icon={IconsLegacy.InfoMedium} />;
IconBoxSample.storyName = "IconBox";
