import React, { memo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { BottomSheetView, BottomSheetHeader, Tag, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import QueuedDrawerBottomSheet from "~/mvvm/components/QueuedDrawer/QueuedDrawerBottomSheet";
import type { TransactionItem } from "../mapCardTransaction";

interface Props {
  readonly transaction: TransactionItem | null;
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function statusAppearance(status: string | undefined): "warning" | "success" | "error" | "gray" {
  switch (status?.toLowerCase()) {
    case "pending":
      return "warning";
    case "validated":
    case "confirmed":
      return "success";
    case "failed":
      return "error";
    default:
      return "gray";
  }
}

function MerchantAvatar({ transaction }: { transaction: TransactionItem }) {
  const { theme } = useTheme();

  if (transaction.logoUri) {
    return <Image source={{ uri: transaction.logoUri }} style={styles.avatar} resizeMode="cover" />;
  }

  return (
    <View
      style={[styles.avatar, { backgroundColor: transaction.logoColor ?? theme.colors.bg.muted }]}
    >
      <Text typography="body3SemiBold" style={{ color: theme.colors.text.white }}>
        {transaction.merchant.slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.detailRow}>
      <Text typography="body3" lx={{ color: "muted" }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

const TransactionDetailBottomSheet = memo(function TransactionDetailBottomSheet({
  transaction,
  isOpen,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isOpen} onClose={onClose} enableDynamicSizing>
      <BottomSheetView style={[styles.content, { paddingBottom: bottomInset + 24 }]}>
        <BottomSheetHeader />

        {transaction && (
          <View style={styles.body}>
            <View style={styles.header}>
              <MerchantAvatar transaction={transaction} />
              <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "center" }}>
                {transaction.merchant}
              </Text>
              <Text typography="body2" lx={{ color: "muted", textAlign: "center" }}>
                {transaction.date}
              </Text>
            </View>

            <View style={styles.details}>
              {transaction.cardLast4 && (
                <DetailRow label={t("baanxCard.transactions.detail.card")}>
                  <Text typography="body3SemiBold" lx={{ color: "base" }}>
                    ***{transaction.cardLast4}
                  </Text>
                </DetailRow>
              )}

              {transaction.status && (
                <DetailRow label={t("baanxCard.transactions.detail.status")}>
                  <Tag
                    size="sm"
                    appearance={statusAppearance(transaction.status)}
                    label={transaction.status}
                  />
                </DetailRow>
              )}

              <DetailRow label={t("baanxCard.transactions.detail.amount")}>
                <Text typography="body3SemiBold" lx={{ color: "base" }}>
                  {transaction.amount}
                </Text>
              </DetailRow>

              {transaction.cryptoAmount && transaction.cryptoCurrency && (
                <DetailRow label={t("baanxCard.transactions.detail.crypto")}>
                  <Text typography="body3SemiBold" lx={{ color: "base" }}>
                    {transaction.cryptoAmount} {transaction.cryptoCurrency}
                  </Text>
                </DetailRow>
              )}

              {transaction.cashbackAmount && transaction.cashbackCurrency && (
                <DetailRow label={t("baanxCard.transactions.detail.cashback")}>
                  <Text typography="body3SemiBold" lx={{ color: "base" }}>
                    {transaction.cashbackAmount} {transaction.cashbackCurrency}
                  </Text>
                </DetailRow>
              )}
            </View>
          </View>
        )}
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  body: {
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  details: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 20,
  },
});

export default TransactionDetailBottomSheet;
