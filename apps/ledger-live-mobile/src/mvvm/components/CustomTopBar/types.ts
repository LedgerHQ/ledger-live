import React from "react";
import type { IconComponent } from "LLM/utils/getDeviceIcon";

export type TopBarActionIcon = {
  id: string;
  icon: IconComponent;
  callback: () => void;
  testID: string;
  accessibilityLabel: string;
  loading?: boolean;
  wrapper?: (children: React.ReactElement) => React.ReactElement;
};
