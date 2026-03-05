import { Tag } from "@ledgerhq/lumen-ui-react";
import React from "react";
import type { ApyProps } from "@ledgerhq/live-common/modularDrawer/types/index";

export const ApyView = ({
  value,
  type,
  appearance,
}: ApyProps & {
  appearance: "success" | "gray";
}) => {
  return (
    <Tag
      size="sm"
      appearance={appearance}
      label={`~ ${value}% ${type}`}
      data-testid="apy-indicator"
    />
  );
};
