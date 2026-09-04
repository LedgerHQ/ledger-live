import React, { useCallback } from "react";
import { ListItem, Spot } from "@ledgerhq/lumen-ui-rnative";
import { ArrowDown, Bank, Cart, Exchange } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DepositOptionId } from "../../types";

export {
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";

type SpotIcon = typeof Bank;

const OPTION_ICONS: Readonly<Record<DepositOptionId, SpotIcon>> = {
  bankTransfer: Bank,
  swap: Exchange,
  receive: ArrowDown,
  buy: Cart,
};

type DepositOptionListItemProps = Readonly<{
  optionId: DepositOptionId;
  onSelect: (id: DepositOptionId) => void;
  children: React.ReactNode;
}>;

export function DepositOptionListItem({
  optionId,
  onSelect,
  children,
}: DepositOptionListItemProps) {
  const handlePress = useCallback(() => {
    onSelect(optionId);
  }, [onSelect, optionId]);

  return (
    <ListItem onPress={handlePress} testID={`pay-card-deposit-option-${optionId}`}>
      {children}
    </ListItem>
  );
}

export function DepositOptionIcon({ optionId }: Readonly<{ optionId: DepositOptionId }>) {
  return <Spot appearance="icon" icon={OPTION_ICONS[optionId]} size={48} />;
}
