import React from "react";
import {
  Box,
  ListItem as LumenListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import type { LumenViewStyle, LumenTextStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { useTranslation } from "~/context/Locale";
import CurrencyIcon from "~/components/CurrencyIcon";
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import { useOperationsListItemViewModel } from "./useOperationsListItemViewModel";

type Props = {
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | undefined;
  accountByAddress: Map<string, AccountLike>;
};

function OperationsListItem({
  operation,
  account,
  parentAccount,
  accountByAddress,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const {
    accountName,
    counterpartyLabel,
    operationType,
    isOutgoing,
    isASendOrReceive,
    currency,
    unit,
    amount,
    amountColor,
    isOptimistic,
    onPress,
  } = useOperationsListItemViewModel({ operation, account, parentAccount, accountByAddress });

  const title = t(`operations.types.${operationType}`);
  const directionLabel = isOutgoing ? t("operationsList.to") : t("operationsList.from");

  // For send/receive: show counterpartyLabel (internal account name or address) with direction.
  // For other types: show own account name without direction, or raw counterpartyLabel as fallback.
  const getSubtitle = () => {
    if (isASendOrReceive && counterpartyLabel) {
      return `${directionLabel} ${counterpartyLabel}`;
    }

    return accountName || counterpartyLabel;
  };

  const subtitle = getSubtitle();

  return (
    <LumenListItem
      onPress={onPress}
      disabled={isOptimistic}
      lx={listItemStyle}
      testID="operations-list-item"
    >
      <ListItemLeading>
        <CurrencyIcon currency={currency} size={48} hideNetwork />
        <ListItemContent>
          <ListItemTitle>{title}</ListItemTitle>
          <ListItemDescription>{subtitle}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
      {!amount.isZero() && (
        <ListItemTrailing>
          <Box lx={trailingContainerStyle}>
            <Text typography="body2SemiBold" lx={{ color: amountColor }}>
              <CurrencyUnitValue showCode unit={unit} value={amount} alwaysShowSign />
            </Text>
            <Text typography="body3" lx={counterValueStyle}>
              <CounterValue
                showCode
                date={operation.date}
                currency={currency}
                value={amount}
                alwaysShowSign
                withPlaceholder
              />
            </Text>
          </Box>
        </ListItemTrailing>
      )}
    </LumenListItem>
  );
}

const listItemStyle: LumenViewStyle = {
  marginHorizontal: "-s8",
};

const trailingContainerStyle: LumenViewStyle = {
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "s4",
};

const counterValueStyle: LumenTextStyle = {
  color: "muted",
};

export default React.memo(OperationsListItem);
