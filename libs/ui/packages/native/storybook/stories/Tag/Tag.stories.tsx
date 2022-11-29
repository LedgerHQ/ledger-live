import React from "react";
import { boolean, select, text } from "@storybook/addon-knobs";

import Tag from "../../../src/components/tags/Tag";
import { storiesOf } from "../storiesOf";
import { Icons } from "../../../src/assets";

const TagSample = () => (
  <Tag
    type={select("type", ["color", "shade", "warning"], "shade")}
    size={select("size", ["small", "medium"], "small")}
    Icon={boolean("icon", false) ? Icons.CircledCheckSolidMedium : undefined}
    uppercase={boolean("uppercase", false)}
  >
    {text("children", "Label")}
  </Tag>
);

storiesOf((story) => story("Tag", module).add("Tag", TagSample));
