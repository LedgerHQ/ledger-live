import React from "react";
import { Tag } from "@ledgerhq/lumen-ui-rnative";
import type { ApyProps } from "@ledgerhq/live-common/modularDrawer/types/index";

export const ApyView = ({
  value,
  type,
  appearance,
}: ApyProps & { appearance: "success" | "gray" }) => (
  <Tag
    size="md"
    appearance={appearance}
    label={`~ ${value}% ${type}`}
    testID={`apy-indicator-${appearance}`}
  />
);
