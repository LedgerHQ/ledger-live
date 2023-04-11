import React from "react";
import Badge from "../../../src/components/tags/Badge";

export default {
  title: "Tag/Badge",
  component: Badge,
};

export const BadgeSample = (args: typeof BadgeSampleArgs) => (
  <Badge badgeVariant={args.badgeVariant} active={args.active}>
    {args.children}
  </Badge>
);
BadgeSample.storyName = "Badge";
const BadgeSampleArgs = {
  badgeVariant: undefined,
  active: false,
  children: "Label",
};
BadgeSample.args = BadgeSampleArgs;
BadgeSample.argTypes = {
  badgeVariant: {
    options: ["main", "primary", undefined],
    control: { type: "select" },
  },
};
