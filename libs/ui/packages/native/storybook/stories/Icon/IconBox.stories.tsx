import React from "react";
import { Icons } from "../../../src/assets";
import { IconBox } from "../../../src/components";

export default {
  title: "Icon/IconBox",
  component: IconBox,
};

export const IconBoxSample = () => <IconBox Icon={Icons.InfoMedium} />;
IconBoxSample.storyName = "IconBox";
