import React from "react";
import { useCategoryVisual } from "../ListItem/useCategoryVisual";
import { DetailRow } from "../DetailRow";
import type { CardTransactionDetailViewProps } from "./types";

export function CardTransactionDetailView({
  merchant,
  category,
  categoryLabel,
  dateLabel,
  rows,
}: CardTransactionDetailViewProps) {
  const { Icon, backgroundStyle } = useCategoryVisual(category);

  return (
    <div className="flex flex-col items-center gap-24 pb-24" data-testid="card-transaction-detail">
      <div className="flex flex-col items-center gap-16">
        <div
          className="flex size-[72px] items-center justify-center rounded-full bg-(--category-bg) text-white dark:bg-(--category-bg-dark) dark:text-black"
          style={backgroundStyle}
        >
          <Icon aria-hidden size={32} />
          <span className="sr-only">{categoryLabel}</span>
        </div>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="heading-4-semi-bold text-base">{merchant}</p>
          <p className="body-2 text-muted">{dateLabel}</p>
        </div>
      </div>
      <div className="flex w-full flex-col gap-12">
        {rows.map(row => (
          <DetailRow key={row.id} row={row} />
        ))}
      </div>
    </div>
  );
}
