import React from "react";
import { DailyOperationsSection, Operation } from "@ledgerhq/types-live";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Box } from "@ledgerhq/lumen-ui-rnative";

type Props = {
  leadingItem?: Operation | null;
  trailingItem?: Operation | null;
  trailingSection?: DailyOperationsSection;
};

const testID = "operations-list-section-separator";

export function SectionSeparator({ leadingItem, trailingItem, trailingSection }: Readonly<Props>) {
  const afterSectionHeader = leadingItem == null && trailingItem != null;
  if (afterSectionHeader) {
    return <Box lx={afterSectionHeaderSpacingStyle} testID={testID} />;
  }
  const afterLastItemInSection = leadingItem != null && trailingItem == null;
  if (afterLastItemInSection) {
    if (trailingSection == null) return null;
    return <Box lx={betweenSectionsSpacingStyle} testID={testID} />;
  }
  return null;
}

const afterSectionHeaderSpacingStyle: LumenViewStyle = {
  height: "s4",
};

const betweenSectionsSpacingStyle: LumenViewStyle = {
  height: "s16",
};
