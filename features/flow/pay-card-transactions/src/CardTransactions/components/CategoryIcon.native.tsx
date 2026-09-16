import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useCategoryVisual } from "./ListItem/useCategoryVisual";
import type { PayCardTransactionCategory } from "@domain/api-card-management";

export type CategoryIconProps = Readonly<{
  category: PayCardTransactionCategory;
  categoryLabel: string;
  size?: 40 | 48;
}>;

export function CategoryIcon({ category, categoryLabel, size = 48 }: CategoryIconProps) {
  const { Icon, backgroundColor, iconColor } = useCategoryVisual(category);
  const iconSize = size === 40 ? 20 : 24;
  const frame = size === 40 ? "s40" : "s48";

  return (
    <Box
      accessibilityLabel={categoryLabel}
      lx={{
        width: frame,
        height: frame,
        borderRadius: "full",
        alignItems: "center",
        justifyContent: "center",
      }}
      style={{ backgroundColor }}
    >
      <Icon size={iconSize} color={iconColor} />
    </Box>
  );
}
