import React, { useCallback } from "react";
import { Card, Spot } from "@ledgerhq/lumen-ui-rnative";
import { ArrowDown, Bank, Cart, Exchange } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DepositOptionId } from "../../types";

export {
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
} from "@ledgerhq/lumen-ui-rnative";

type SpotIcon = typeof Bank;

const OPTION_ICONS: Readonly<Record<DepositOptionId, SpotIcon>> = {
  bankTransfer: Bank,
  swap: Exchange,
  receive: ArrowDown,
  buy: Cart,
};

type DepositOptionCardProps = Readonly<{
  optionId: DepositOptionId;
  onSelect: (id: DepositOptionId) => void;
  children: React.ReactNode;
}>;

export function DepositOptionCard({ optionId, onSelect, children }: DepositOptionCardProps) {
  const handlePress = useCallback(() => {
    onSelect(optionId);
  }, [onSelect, optionId]);

  return (
    <Card type="interactive" onPress={handlePress} testID={`pay-card-deposit-option-${optionId}`}>
      {children}
    </Card>
  );
}

export function DepositOptionIcon({ optionId }: Readonly<{ optionId: DepositOptionId }>) {
  return <Spot appearance="icon" icon={OPTION_ICONS[optionId]} size={48} />;
}
