import React from "react";
import { useCategoryVisual } from "./ListItem/useCategoryVisual";
import type { PayCardTransactionCategory } from "@domain/api-card-management";

export type CategoryIconProps = Readonly<{
  category: PayCardTransactionCategory;
  categoryLabel: string;
  size?: 40 | 48;
}>;

export function CategoryIcon({ category, categoryLabel, size = 48 }: CategoryIconProps) {
  const { Icon, backgroundStyle } = useCategoryVisual(category);
  const iconSize = size === 40 ? 20 : 24;
  const frameClassName = size === 40 ? "size-40" : "size-48";

  return (
    <div
      className={`flex ${frameClassName} shrink-0 items-center justify-center rounded-full bg-(--category-bg) text-white dark:bg-(--category-bg-dark) dark:text-black`}
      style={backgroundStyle}
    >
      <Icon aria-hidden size={iconSize} />
      <span className="sr-only">{categoryLabel}</span>
    </div>
  );
}
