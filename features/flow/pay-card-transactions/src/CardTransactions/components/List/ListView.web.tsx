import React from "react";
import { ListItem } from "../ListItem";
import type { ListProps } from "./types";

export function ListView({ transactions, formatters, onOpenTransaction }: ListProps) {
  return (
    <div className="-mx-8 flex flex-col" data-testid="card-transactions-list">
      {transactions.map(item => (
        <ListItem
          key={item.transaction.id}
          item={item}
          formatters={formatters}
          onOpenTransaction={onOpenTransaction ? () => onOpenTransaction(item) : undefined}
        />
      ))}
    </div>
  );
}
