import React from "react";
import {
  ListItem as CardTransactionListItem,
  type CardTransactionItem,
} from "@features/flow-pay-card-transactions";
import {
  AmountDisplay,
  Box,
  Spot,
  Subheader,
  SubheaderRow,
  SubheaderShowMore,
  SubheaderTitle,
  Text,
  TileButton,
} from "@ledgerhq/lumen-ui-rnative";
import { ArrowDown, CreditCard, Plus } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { CardAssetDetailsContentProps } from "./types";

const LOADING_FORMATTER: NonNullable<CardAssetDetailsContentProps["formatBalance"]> = () => ({
  integerPart: "0",
  decimalPart: "00",
  currencyText: "",
  decimalSeparator: ".",
  currencyPosition: "start",
});

type CardAssetDetailsDrawerProps = CardAssetDetailsContentProps &
  Readonly<{
    onTransactionPress: (transaction: CardTransactionItem) => void;
  }>;

export function CardAssetDetailsDrawer({
  asset,
  transactions = [],
  formatBalance,
  formatters,
  onTopUp,
  onWithdraw,
  onShowHistory,
  onTransactionPress,
}: CardAssetDetailsDrawerProps) {
  const { t } = useTranslation();
  const isAmountLoading = asset.countervalueAmount === null || !formatBalance;

  return (
    <Box lx={{ gap: "s24", paddingBottom: "s24" }}>
      <Box
        lx={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: "s48",
        }}
      >
        <AmountDisplay
          value={asset.countervalueAmount ?? 0}
          formatter={formatBalance ?? LOADING_FORMATTER}
          loading={isAmountLoading}
          size="md"
          accessibilityLabel={`${asset.name} ${asset.ticker}`}
          accessibilityState={{ busy: isAmountLoading }}
        />
      </Box>
      <Box lx={{ flexDirection: "row", gap: "s8" }}>
        <Box lx={{ flex: 1, minWidth: "s0" }}>
          <TileButton icon={Plus} onPress={onTopUp} isFull>
            {t("payTab.card.assets.details.topUp")}
          </TileButton>
        </Box>
        <Box lx={{ flex: 1, minWidth: "s0" }}>
          <TileButton icon={ArrowDown} onPress={onWithdraw} isFull>
            {t("payTab.card.assets.details.withdraw")}
          </TileButton>
        </Box>
      </Box>
      {transactions.length > 0 ? (
        <Box lx={{ gap: "s8" }}>
          <Subheader>
            <SubheaderRow onPress={onShowHistory}>
              <SubheaderTitle>{t("payTab.card.assets.details.transactions")}</SubheaderTitle>
              <SubheaderShowMore />
            </SubheaderRow>
          </Subheader>
          <Box lx={{ gap: "s2" }}>
            {transactions.map(item => (
              <CardTransactionListItem
                key={item.transaction.id}
                item={item}
                formatters={formatters}
                onPress={() => onTransactionPress(item)}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Box lx={{ alignItems: "center", gap: "s24", paddingVertical: "s24" }}>
          <Spot appearance="icon" icon={CreditCard} size={72} />
          <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
            {t("payTab.cardTransactions.history.empty.title")}
          </Text>
        </Box>
      )}
    </Box>
  );
}
