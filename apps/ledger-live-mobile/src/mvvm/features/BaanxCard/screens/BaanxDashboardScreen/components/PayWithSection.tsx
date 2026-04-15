import React, { memo, useCallback, type ReactNode } from "react";
import { Pressable, View, ScrollView, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "~/context/Locale";
import { Text, Spot, BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import { SparksFill, CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import QueuedDrawerBottomSheet from "~/mvvm/components/QueuedDrawer/QueuedDrawerBottomSheet";
import type { StablecoinOption } from "../useBaanxDashboardViewModel";

const SMART_PAY_ID = "smart-pay";

interface SelectableTileProps {
  readonly icon: ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly selected: boolean;
  readonly onPress: () => void;
}

const SelectableTile = memo(function SelectableTile({
  icon,
  title,
  subtitle,
  selected,
  onPress,
}: SelectableTileProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      style={[
        styles.tile,
        { backgroundColor: theme.colors.bg.surface },
        selected && { borderWidth: 1, borderColor: theme.colors.text.base },
      ]}
      onPress={onPress}
    >
      {selected && <CheckmarkCircleFill size={20} color="base" style={styles.checkmark} />}
      {icon}
      <View style={styles.tileText}>
        <Text typography="body2SemiBold" lx={{ color: "base" }} numberOfLines={1}>
          {title}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
});

interface Props {
  readonly selectedPaymentId: string;
  readonly stablecoins: readonly StablecoinOption[];
  readonly onSelectPayment: (id: string) => void;
  readonly isSmartPaySheetOpen: boolean;
  readonly onCloseSmartPaySheet: () => void;
}

const PayWithSection = memo(function PayWithSection({
  selectedPaymentId,
  stablecoins,
  onSelectPayment,
  isSmartPaySheetOpen,
  onCloseSmartPaySheet,
}: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  const handleSelectSmartPay = useCallback(() => {
    onSelectPayment(SMART_PAY_ID);
  }, [onSelectPayment]);

  return (
    <View style={styles.section}>
      <Text typography="heading5SemiBold" lx={{ color: "base" }}>
        {t("baanxCard.dashboard.payWith.title")}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        <SelectableTile
          icon={<Spot appearance="icon" icon={SparksFill} size={48} />}
          title={t("baanxCard.dashboard.payWith.smartPay")}
          subtitle="Auto-pay"
          selected={selectedPaymentId === SMART_PAY_ID}
          onPress={handleSelectSmartPay}
        />

        {stablecoins.map(coin => (
          <SelectableTile
            key={coin.id}
            icon={<CryptoIcon ledgerId={coin.id} ticker={coin.ticker} size={48} />}
            title={coin.ticker}
            subtitle={coin.name}
            selected={selectedPaymentId === coin.id}
            onPress={() => onSelectPayment(coin.id)}
          />
        ))}
      </ScrollView>

      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isSmartPaySheetOpen}
        onClose={onCloseSmartPaySheet}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
          <BottomSheetHeader />
          <Spot appearance="icon" icon={SparksFill} size={48} lx={{ alignSelf: "center" }} />
          <Text
            typography="heading4SemiBold"
            lx={{ color: "base", textAlign: "center", marginTop: "s12" }}
          >
            {t("baanxCard.dashboard.payWith.smartPaySheet.title")}
          </Text>
          <Text typography="body2" lx={{ color: "muted", textAlign: "center", marginTop: "s8" }}>
            {t("baanxCard.dashboard.payWith.smartPaySheet.description")}
          </Text>

          <Text typography="heading5SemiBold" lx={{ color: "base", marginTop: "s24" }}>
            {t("baanxCard.dashboard.payWith.smartPaySheet.howItWorks")}
          </Text>
          <View style={styles.steps}>
            <StepRow number={1} text={t("baanxCard.dashboard.payWith.smartPaySheet.step1")} />
            <StepRow number={2} text={t("baanxCard.dashboard.payWith.smartPaySheet.step2")} />
            <StepRow number={3} text={t("baanxCard.dashboard.payWith.smartPaySheet.step3")} />
          </View>
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </View>
  );
});

function StepRow({
  number,
  text,
}: {
  number: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  text: string;
}) {
  return (
    <View style={styles.stepRow}>
      <Spot appearance="number" number={number} size={32} />
      <Text typography="body2" lx={{ color: "base", flex: 1 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  list: {
    gap: 10,
  },
  tile: {
    position: "relative",
    width: 106,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  checkmark: {
    position: "absolute",
    top: 6,
    right: 6,
    zIndex: 1,
  },
  tileText: {
    gap: 4,
    alignItems: "center",
    width: "100%",
  },
  steps: {
    gap: 12,
    marginTop: 12,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});

export default PayWithSection;
