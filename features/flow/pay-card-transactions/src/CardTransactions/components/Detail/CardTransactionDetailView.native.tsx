import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import { useCategoryVisual } from "../ListItem/useCategoryVisual";
import { DetailRow } from "./DetailRow";
import type { CardTransactionDetailViewProps } from "./types";

const CATEGORY_ICON_SIZE = 32;

export function CardTransactionDetailView({
  merchant,
  category,
  categoryLabel,
  dateLabel,
  rows,
}: CardTransactionDetailViewProps) {
  const { Icon, backgroundColor, iconColor } = useCategoryVisual(category);

  return (
    <Box
      lx={{ alignItems: "center", gap: "s24", paddingHorizontal: "s16" }}
      testID="card-transaction-detail"
    >
      <Box lx={{ alignItems: "center", gap: "s12" }}>
        <Box
          accessibilityLabel={categoryLabel}
          lx={{
            borderRadius: "full",
            alignItems: "center",
            justifyContent: "center",
          }}
          style={{ width: 72, height: 72, backgroundColor }}
        >
          <Icon size={CATEGORY_ICON_SIZE} color={iconColor} />
        </Box>
        <Box lx={{ alignItems: "center", gap: "s4" }}>
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {merchant}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
            {dateLabel}
          </Text>
        </Box>
      </Box>
      <Box lx={{ gap: "s12", width: "full" }}>
        {rows.map(row => (
          <DetailRow key={row.id} row={row} />
        ))}
      </Box>
    </Box>
  );
}
