import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import type { CardTransactionItem } from "../../types";
import type { HistorySection } from "./types";

type SectionSeparatorProps = Readonly<{
  leadingItem?: CardTransactionItem;
  trailingItem?: CardTransactionItem;
  trailingSection?: HistorySection;
}>;

export function SectionSeparator({
  leadingItem,
  trailingItem,
  trailingSection,
}: SectionSeparatorProps) {
  const afterSectionHeader = leadingItem == null && trailingItem != null;
  if (afterSectionHeader) {
    return <Box lx={afterSectionHeaderSpacingStyle} testID="card-history-section-separator" />;
  }

  const afterLastItemInSection = leadingItem != null && trailingItem == null;
  if (afterLastItemInSection) {
    if (trailingSection == null) return null;
    return <Box lx={betweenSectionsSpacingStyle} testID="card-history-section-separator" />;
  }

  return null;
}

const afterSectionHeaderSpacingStyle: LumenViewStyle = {
  height: "s12",
};

const betweenSectionsSpacingStyle: LumenViewStyle = {
  height: "s24",
};
