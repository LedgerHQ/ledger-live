import React from "react";
import type { BalanceFilter } from "../../state";
import {
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
  FilterOptionAmounts,
  FilterOptionCard,
  FilterOptionIcon,
} from "./BalanceFilterOptionParts";
import type { BalanceFilterOption } from "../../types";

type BalanceFilterOptionRowProps = Readonly<{
  option: BalanceFilterOption;
  selected: boolean;
  onSelect: (id: BalanceFilter) => void;
}>;

export function BalanceFilterOptionRow({
  option,
  selected,
  onSelect,
}: BalanceFilterOptionRowProps) {
  const rowKey = option.ticker?.toLowerCase() ?? "all";

  return (
    <FilterOptionCard optionId={option.id} selected={selected} rowKey={rowKey} onSelect={onSelect}>
      <CardHeader>
        <CardLeading>
          <FilterOptionIcon ledgerId={option.ledgerId} ticker={option.ticker} />
          <CardContent>
            <CardContentTitle>{option.title}</CardContentTitle>
            {option.ticker != null ? (
              <CardContentDescription>{option.ticker}</CardContentDescription>
            ) : null}
          </CardContent>
        </CardLeading>
        <CardTrailing>
          <FilterOptionAmounts
            countervalueLabel={option.countervalueLabel}
            cryptoAmountLabel={option.cryptoAmountLabel}
          />
        </CardTrailing>
      </CardHeader>
    </FilterOptionCard>
  );
}
