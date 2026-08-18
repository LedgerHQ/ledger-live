import React, { useCallback } from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { Card, Spot } from "@ledgerhq/lumen-ui-react";
import { Bundle } from "@ledgerhq/lumen-ui-react/symbols";
import type { BalanceFilter } from "../../state";

export {
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-react";

type FilterOptionCardProps = Readonly<{
  optionId: BalanceFilter;
  selected: boolean;
  rowKey: string;
  onSelect: (id: BalanceFilter) => void;
  children: React.ReactNode;
}>;

export function FilterOptionCard({
  optionId,
  selected,
  rowKey,
  onSelect,
  children,
}: FilterOptionCardProps) {
  const handlePress = useCallback(() => {
    onSelect(optionId);
  }, [onSelect, optionId]);

  return (
    <Card
      type="interactive"
      outlined={selected}
      onClick={handlePress}
      data-testid={`pay-card-balance-filter-option-${rowKey}`}
    >
      {children}
    </Card>
  );
}

type FilterOptionIconProps = Readonly<{
  ledgerId?: string;
  ticker?: string;
}>;

export function FilterOptionIcon({ ledgerId, ticker }: FilterOptionIconProps) {
  if (ledgerId == null) {
    return <Spot appearance="icon" icon={Bundle} size={48} />;
  }
  return <CryptoIcon ledgerId={ledgerId} ticker={ticker ?? ""} size={48} />;
}

type FilterOptionAmountsProps = Readonly<{
  countervalueLabel: string;
  cryptoAmountLabel?: string;
}>;

export function FilterOptionAmounts({
  countervalueLabel,
  cryptoAmountLabel,
}: FilterOptionAmountsProps) {
  return (
    <div className="flex flex-col items-end gap-4">
      <span className="body-2-semi-bold">{countervalueLabel}</span>
      {cryptoAmountLabel != null ? (
        <span className="body-3 text-muted">{cryptoAmountLabel}</span>
      ) : null}
    </div>
  );
}
