import React from "react";
import { ListItem } from "../ListItem";
import type { ListProps } from "./types";

export function ListView({ transactions, formatters }: ListProps) {
  return (
    <div className="flex flex-col" data-testid="card-transactions-list">
      {transactions.map(item => (
        <ListItem key={item.transaction.id} item={item} formatters={formatters} />
      ))}
    </div>
  );
}
