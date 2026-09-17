import React from "react";
import { CategoryIcon } from "../../CardTransactions/components/CategoryIcon";
import { DotIcon, getDotIconProps, Spinner } from "@ledgerhq/lumen-ui-react";
import { Close } from "@ledgerhq/lumen-ui-react/symbols";
import type { PayCardTransaction, PayCardTransactionCategory } from "@domain/api-card-management";

const MEDIA_SIZE = 40;

type StatusIconProps = Readonly<{
  category: PayCardTransactionCategory;
  categoryLabel: string;
  status: PayCardTransaction["status"];
}>;

function getCardStatusDot(status: PayCardTransaction["status"]) {
  if (status === "DECLINED") {
    return { icon: Close, appearance: "error" as const };
  }

  if (status === "REVERTED") {
    return { icon: Spinner, appearance: "muted" as const };
  }

  return undefined;
}

export function StatusIcon({ category, categoryLabel, status }: StatusIconProps) {
  const categoryIcon = <CategoryIcon category={category} categoryLabel={categoryLabel} size={40} />;
  const dot = getCardStatusDot(status);

  if (!dot) {
    return categoryIcon;
  }

  return (
    <DotIcon
      icon={dot.icon}
      appearance={dot.appearance}
      size={getDotIconProps("mediaImage", MEDIA_SIZE).size}
      pin="top-end"
    >
      {categoryIcon}
    </DotIcon>
  );
}
