import React, { memo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { useTranslation } from "~/context/Locale";
import { Text, Button, Box } from "@ledgerhq/lumen-ui-rnative";
import SafeAreaView from "~/components/SafeAreaView";
import { TrackScreen } from "~/analytics";
import type { BaanxCardStatus, BaanxTransaction } from "@ledgerhq/baanx";

interface Props {
  readonly card: BaanxCardStatus | undefined;
  readonly cardLoading: boolean;
  readonly cardError: string | null;
  readonly transactions: BaanxTransaction[];
  readonly txLoading: boolean;
  readonly txError: string | null;
  readonly onLogout: () => void;
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "#00C853";
    case "FROZEN":
      return "#FF9100";
    case "BLOCKED":
      return "#FF1744";
    default:
      return "#999";
  }
}

function formatAmount(sign: string, amount: string, currency: string): string {
  const prefix = sign === "DEBIT" ? "-" : "+";
  return `${prefix}${amount} ${currency.toUpperCase()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const BaanxDashboardScreenView = ({
  card,
  cardLoading,
  cardError,
  transactions,
  txLoading,
  txError,
  onLogout,
}: Props) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView isFlex>
      <TrackScreen name="BaanxCardDashboard" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text typography="heading4SemiBold" lx={{ color: "base" }}>
            {t("baanxCard.cardStatus.title")}
          </Text>
          <Button appearance="gray" size="sm" onPress={onLogout}>
            {t("baanxCard.logout")}
          </Button>
        </View>

        {cardLoading ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("baanxCard.cardStatus.loading")}
          </Text>
        ) : cardError ? (
          <Text typography="body2" lx={{ color: "error" }}>
            {t("baanxCard.cardStatus.error")}
          </Text>
        ) : card ? (
          <View style={styles.cardBox}>
            <View style={styles.cardRow}>
              <Text typography="heading5SemiBold" lx={{ color: "base" }}>
                {card.holderName}
              </Text>
              <View style={[styles.badge, { backgroundColor: statusColor(card.status) + "22" }]}>
                <Text typography="body3SemiBold" style={{ color: statusColor(card.status) }}>
                  {card.status}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {t("baanxCard.cardStatus.cardNumber")}
                </Text>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {"•••• " + card.panLast4}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {t("baanxCard.cardStatus.expiry")}
                </Text>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {card.expiryDate}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {t("baanxCard.cardStatus.type")}
                </Text>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {card.type}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("baanxCard.cardStatus.noCard")}
          </Text>
        )}

        <Text typography="heading5SemiBold" lx={{ color: "base" }}>
          {t("baanxCard.transactions.title")}
        </Text>

        {txLoading ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("baanxCard.transactions.loading")}
          </Text>
        ) : txError ? (
          <Text typography="body2" lx={{ color: "error" }}>
            {t("baanxCard.transactions.error")}
          </Text>
        ) : transactions.length === 0 ? (
          <Text typography="body2" lx={{ color: "muted" }}>
            {t("baanxCard.transactions.empty")}
          </Text>
        ) : (
          transactions.map(tx => (
            <View key={tx.id} style={styles.txRow}>
              <View style={styles.txLeft}>
                <Text typography="body2" lx={{ color: "base" }}>
                  {tx.merchantNameLocation}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {formatDate(tx.dateTime) + " · " + tx.mccCategory}
                </Text>
              </View>
              <View style={styles.txRight}>
                <Text
                  typography="body2SemiBold"
                  style={{ color: tx.sign === "DEBIT" ? undefined : "#00C853" }}
                >
                  {formatAmount(tx.sign, tx.amountInTransactionCurrency, tx.transactionCurrency)}
                </Text>
                <Text typography="body3" lx={{ color: "muted" }}>
                  {tx.status}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBox: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.03)",
    gap: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  infoRow: {
    flexDirection: "row",
    gap: 24,
  },
  infoItem: {
    gap: 2,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  txLeft: {
    flex: 1,
    gap: 2,
  },
  txRight: {
    alignItems: "flex-end",
    gap: 2,
  },
});

export default memo(BaanxDashboardScreenView);
