import React from "react";
import { DotIcon } from "@ledgerhq/lumen-ui-rnative";
import { Close, Refresh } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardTransaction, PayCardTransactionCategory } from "@domain/api-card-management";
import { CategoryIcon } from "../../CardTransactions/components/CategoryIcon";
import { getCardStatusAppearance } from "./getCardStatusAppearance";

const DOT_SIZE = 20;

type StatusIconProps = Readonly<{
  category: PayCardTransactionCategory;
  categoryLabel: string;
  status: PayCardTransaction["status"];
  iconSize: 40 | 48;
}>;

export function StatusIcon({ category, categoryLabel, status, iconSize }: StatusIconProps) {
  const categoryIcon = (
    <CategoryIcon category={category} categoryLabel={categoryLabel} size={iconSize} />
  );
  const appearance = getCardStatusAppearance(status);

  if (!appearance) {
    return categoryIcon;
  }

  return (
    <DotIcon
      icon={status === "DECLINED" ? Close : Refresh}
      appearance={appearance}
      size={DOT_SIZE}
      pin="top-end"
    >
      {categoryIcon}
    </DotIcon>
  );
}
