import React from "react";
import { CategoryIcon } from "../../CardTransactions/components/CategoryIcon";
import { DotIcon, getDotIconProps, Spinner } from "@ledgerhq/lumen-ui-react";
import { Close } from "@ledgerhq/lumen-ui-react/symbols";
import type { PayCardTransaction, PayCardTransactionCategory } from "@domain/api-card-management";
import { getCardStatusAppearance } from "./getCardStatusAppearance";

const MEDIA_SIZE = 40;

type StatusIconProps = Readonly<{
  category: PayCardTransactionCategory;
  categoryLabel: string;
  status: PayCardTransaction["status"];
}>;

export function StatusIcon({ category, categoryLabel, status }: StatusIconProps) {
  const categoryIcon = <CategoryIcon category={category} categoryLabel={categoryLabel} size={40} />;
  const appearance = getCardStatusAppearance(status);

  if (!appearance) {
    return categoryIcon;
  }

  return (
    <DotIcon
      icon={status === "DECLINED" ? Close : Spinner}
      appearance={appearance}
      size={getDotIconProps("mediaImage", MEDIA_SIZE).size}
      pin="top-end"
    >
      {categoryIcon}
    </DotIcon>
  );
}
