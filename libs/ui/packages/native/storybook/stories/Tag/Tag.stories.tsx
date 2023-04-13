import React from "react";

import Tag from "../../../src/components/tags/Tag";
import { Icons } from "../../../src/assets";

export default {
  title: "Tag/Tag",
  component: Tag,
};

export const TagSample = (args: typeof TagSampleArgs) => (
  <Tag
    type={args.type}
    size={args.size}
    Icon={args.icon ? Icons.CircledCheckSolidMedium : undefined}
    uppercase={args.uppercase}
  >
    {args.children}
  </Tag>
);
TagSample.storyName = "Tag";
const TagSampleArgs = {
  type: "shade" as const,
  size: "small" as const,
  icon: false,
  uppercase: false,
  children: "Label",
};
TagSample.args = TagSampleArgs;
TagSample.argTypes = {
  type: {
    options: ["color", "shade", "warning"],
    control: { type: "select" },
  },
  size: {
    options: ["small", "medium"],
    control: { type: "select" },
  },
};
