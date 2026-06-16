import React from "react";
import {
  Box,
  DotIndicator,
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
import CurrencyUnitValue from "~/components/CurrencyUnitValue";
import CounterValue from "~/components/CounterValue";
import TransactionalIcon from "LLM/components/TransactionalIcon";
import { useOperationsListItemViewModel } from "./useOperationsListItemViewModel";

type Props = {
  operation: Operation;
  account: AccountLike;
  parentAccount: Account | undefined;
  accountByAddress: Map<string, AccountLike>;
  isPending: boolean;
  lastSeenTs: number | null;
};

function OperationsListItem({
  operation,
  account,
  parentAccount,
  accountByAddress,
  isPending,
  lastSeenTs,
}: Readonly<Props>) {
  const { t } = useTranslation();
  const {
    accountName,
    counterpartyLabel,
    operationType,
    isOutgoing,
    isASendOrReceive,
    isUnread,
    currency,
    unit,
    amount,
    amountColor,
    hasFailed,
    onPress,
  } = useOperationsListItemViewModel({
    operation,
    account,
    parentAccount,
    accountByAddress,
    lastSeenTs,
  });

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
    <LumenListItem onPress={onPress} lx={listItemStyle} testID="operations-list-item">
      <ListItemLeading>
        <TransactionalIcon
          operationType={operationType}
          isPending={isPending}
          hasFailed={hasFailed}
          currency={currency}
          mediaSize={48}
        />
        <ListItemContent>
          <Box lx={titleRowStyle}>
            <ListItemTitle>{title}</ListItemTitle>
            {isUnread && <DotIndicator appearance="base" testID="unread-indicator" />}
          </Box>
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

const titleRowStyle: LumenViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
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
