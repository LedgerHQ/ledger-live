import React, { useCallback } from "react";
import CryptoIcon from "@ledgerhq/crypto-icons/native";
import {
  Box,
  Card,
  CardContentDescription,
  CardContentTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Placeholder } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { PayCardBalanceFilter } from "../../state";

export {
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  CardTrailing,
} from "@ledgerhq/lumen-ui-rnative";

type FilterOptionCardProps = Readonly<{
  optionId: PayCardBalanceFilter;
  selected: boolean;
  rowKey: string;
  onSelect: (id: PayCardBalanceFilter) => void;
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
      onPress={handlePress}
      testID={`pay-card-balance-filter-option-${rowKey}`}
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
    return <Spot appearance="icon" icon={Placeholder} size={48} />;
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
    <Box lx={{ alignItems: "flex-end" }}>
      <CardContentTitle>{countervalueLabel}</CardContentTitle>
      {cryptoAmountLabel != null ? (
        <CardContentDescription>{cryptoAmountLabel}</CardContentDescription>
      ) : null}
    </Box>
  );
}
