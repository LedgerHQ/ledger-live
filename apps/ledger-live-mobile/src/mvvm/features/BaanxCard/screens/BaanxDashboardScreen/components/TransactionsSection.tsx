import React, { memo } from "react";
import { View, StyleSheet, Pressable, Image } from "react-native";
import { useTranslation } from "~/context/Locale";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { ChevronRight } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { TransactionItem } from "../mockData";

interface Props {
  readonly transactions: readonly TransactionItem[];
}

function MerchantLogo({ tx }: { tx: TransactionItem }) {
  const { theme } = useTheme();

  if (tx.logoUri) {
    return <Image source={{ uri: tx.logoUri }} style={styles.merchantLogo} resizeMode="cover" />;
  }
  return (
    <View style={[styles.merchantLogo, { backgroundColor: tx.logoColor ?? theme.colors.bg.muted }]}>
      <Text typography="body3SemiBold" style={{ color: theme.colors.text.white }}>
        {tx.merchant.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

const TransactionsSection = memo(function TransactionsSection({ transactions }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Pressable style={styles.header} hitSlop={8}>
        <Text typography="heading5SemiBold" lx={{ color: "base" }}>
          {t("baanxCard.transactions.title")}
        </Text>
        <ChevronRight size={20} color="muted" />
      </Pressable>

      <View style={styles.list}>
        {transactions.map(tx => (
          <ListItem key={tx.id} lx={listItemLx}>
            <ListItemLeading>
              <MerchantLogo tx={tx} />
              <ListItemContent style={listItemContentStyle}>
                <ListItemTitle typography="body2SemiBold" numberOfLines={1}>
                  {tx.merchant}
                </ListItemTitle>
                <ListItemDescription typography="body3" numberOfLines={1}>
                  {tx.date}
                </ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            <ListItemTrailing>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                {tx.amount} {tx.currency}
              </Text>
            </ListItemTrailing>
          </ListItem>
        ))}
      </View>
    </View>
  );
});

const listItemLx = { marginHorizontal: "-s8" as const };

const listItemContentStyle = { flex: 1, minWidth: 0 };

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  list: {
    paddingHorizontal: 8,
  },
  merchantLogo: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TransactionsSection;
