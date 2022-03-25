import React from "react";
import { boolean, text } from "@storybook/addon-knobs";

import Tag from "../../../src/components/tags/Tag";
import { storiesOf } from "../storiesOf";

const TagSample = () => (
  <Tag active={boolean("active", false)} uppercase={boolean("uppercase", true)}>
    {text("children", "Label")}
  </Tag>
);

storiesOf((story) => story("Tag", module).add("Tag", TagSample));
