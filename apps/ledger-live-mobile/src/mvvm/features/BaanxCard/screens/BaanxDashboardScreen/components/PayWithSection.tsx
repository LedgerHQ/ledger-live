import React, { memo, useCallback, useState, type ReactNode } from "react";
import { Image, LayoutAnimation, Pressable, ScrollView, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import {
  Text,
  Spot,
  Button,
  BottomSheetView,
  BottomSheetHeader,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderInfo,
} from "@ledgerhq/lumen-ui-rnative";
import {
  SparksFill,
  CheckmarkCircleFill,
  Target,
  TransferVertical,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { CryptoIcon } from "@ledgerhq/native-ui/pre-ldls";
import QueuedDrawerBottomSheet from "~/mvvm/components/QueuedDrawer/QueuedDrawerBottomSheet";
import type { StablecoinOption } from "../useBaanxDashboardViewModel";
import paymentMethodImage from "./payment-method-hero.jpg";

const SMART_PAY_ID = "smart-pay";
const TILE_WIDTH = 106;
const TILE_GAP = 10;
const TILE_STEP = TILE_WIDTH + TILE_GAP;

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
        {
          backgroundColor: theme.colors.bg.surface,
          borderColor: selected ? theme.colors.text.base : "transparent",
        },
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

interface DraggableCoinTileProps {
  readonly coin: StablecoinOption;
  readonly index: number;
  readonly selected: boolean;
  readonly onPress: () => void;
  readonly onReorder: (from: number, to: number) => void;
  readonly totalCount: number;
  readonly onDragActiveChange: (active: boolean) => void;
}

const DraggableCoinTile = memo(function DraggableCoinTile({
  coin,
  index,
  selected,
  onPress,
  onReorder,
  totalCount,
  onDragActiveChange,
}: DraggableCoinTileProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const dragging = useSharedValue(false);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activateAfterLongPress(250)
    .onStart(() => {
      dragging.value = true;
      scale.value = withSpring(1.08);
      onDragActiveChange(true);
    })
    .onUpdate(e => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      const offset = Math.round(translateX.value / TILE_STEP);
      const newIndex = Math.max(0, Math.min(totalCount - 1, index + offset));

      if (newIndex !== index) {
        onReorder(index, newIndex);
      }

      translateX.value = withSpring(0);
      scale.value = withSpring(1);
      dragging.value = false;
      onDragActiveChange(false);
    })
    .onFinalize(() => {
      if (dragging.value) {
        translateX.value = withSpring(0);
        scale.value = withSpring(1);
        dragging.value = false;
        onDragActiveChange(false);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    zIndex: dragging.value ? 100 : 0,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>
        <SelectableTile
          icon={<CryptoIcon ledgerId={coin.id} ticker={coin.ticker} size={48} />}
          title={coin.ticker}
          subtitle={coin.formattedBalance}
          selected={selected}
          onPress={onPress}
        />
      </Animated.View>
    </GestureDetector>
  );
});

interface Props {
  readonly selectedPaymentId: string;
  readonly stablecoins: readonly StablecoinOption[];
  readonly onSelectPayment: (id: string) => void;
  readonly onReorderStablecoins: (data: readonly StablecoinOption[]) => void;
  readonly isSmartPaySheetOpen: boolean;
  readonly onOpenSmartPaySheet: () => void;
  readonly onCloseSmartPaySheet: () => void;
}

const PayWithSection = memo(function PayWithSection({
  selectedPaymentId,
  stablecoins,
  onSelectPayment,
  onReorderStablecoins,
  isSmartPaySheetOpen,
  onOpenSmartPaySheet,
  onCloseSmartPaySheet,
}: Props) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [isDragActive, setIsDragActive] = useState(false);

  const handleSelectSmartPay = useCallback(() => {
    onSelectPayment(SMART_PAY_ID);
  }, [onSelectPayment]);

  const handleSelectCoin = useCallback(
    (id: string) => {
      onSelectPayment(id);
    },
    [onSelectPayment],
  );

  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      LayoutAnimation.configureNext({
        duration: 300,
        update: { type: LayoutAnimation.Types.easeInEaseOut },
      });
      const next = [...stablecoins];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      onReorderStablecoins(next);
    },
    [stablecoins, onReorderStablecoins],
  );

  return (
    <View style={styles.section}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>{t("baanxCard.dashboard.payWith.title")}</SubheaderTitle>
          <SubheaderInfo onPress={onOpenSmartPaySheet} />
        </SubheaderRow>
      </Subheader>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!isDragActive}
        contentContainerStyle={styles.list}
      >
        <SelectableTile
          icon={<Spot appearance="icon" icon={SparksFill} size={48} />}
          title={t("baanxCard.dashboard.payWith.smartPay")}
          subtitle="Auto-pay"
          selected={selectedPaymentId === SMART_PAY_ID}
          onPress={handleSelectSmartPay}
        />

        {stablecoins.map((coin, idx) => (
          <DraggableCoinTile
            key={coin.id}
            coin={coin}
            index={idx}
            selected={selectedPaymentId === coin.id}
            onPress={() => handleSelectCoin(coin.id)}
            onReorder={handleReorder}
            totalCount={stablecoins.length}
            onDragActiveChange={setIsDragActive}
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
          <View style={styles.sheetImageWrapper}>
            <Image
              source={paymentMethodImage}
              style={styles.sheetImage}
              resizeMode="cover"
              borderRadius={24}
            />
          </View>

          <Text typography="heading2SemiBold" lx={{ color: "base", marginTop: "s24" }}>
            {t("baanxCard.dashboard.payWith.paymentMethodSheet.title")}
          </Text>

          <View style={styles.sheetItems}>
            <PaymentMethodRow
              icon={SparksFill}
              title={t("baanxCard.dashboard.payWith.paymentMethodSheet.smartPay.title")}
              description={t("baanxCard.dashboard.payWith.paymentMethodSheet.smartPay.description")}
            />
            <PaymentMethodRow
              icon={Target}
              title={t("baanxCard.dashboard.payWith.paymentMethodSheet.assetByDefault.title")}
              description={t(
                "baanxCard.dashboard.payWith.paymentMethodSheet.assetByDefault.description",
              )}
            />
            <PaymentMethodRow
              icon={TransferVertical}
              title={t("baanxCard.dashboard.payWith.paymentMethodSheet.assetOrder.title")}
              description={t(
                "baanxCard.dashboard.payWith.paymentMethodSheet.assetOrder.description",
              )}
            />
          </View>

          <Button
            appearance="base"
            size="lg"
            lx={{ width: "full", marginTop: "s24" }}
            onPress={onCloseSmartPaySheet}
          >
            {t("baanxCard.dashboard.payWith.paymentMethodSheet.gotIt")}
          </Button>
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </View>
  );
});

function PaymentMethodRow({
  icon,
  title,
  description,
}: {
  icon: typeof SparksFill;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.methodRow}>
      <Spot appearance="icon" icon={icon} size={32} />
      <View style={styles.methodText}>
        <Text typography="body2SemiBold" lx={{ color: "base" }}>
          {title}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }}>
          {description}
        </Text>
      </View>
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
    width: TILE_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
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
  sheetImageWrapper: {
    borderRadius: 24,
    overflow: "hidden",
  },
  sheetImage: {
    width: "100%",
    height: 240,
  },
  sheetItems: {
    gap: 4,
    marginTop: 4,
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
  },
  methodText: {
    flex: 1,
    gap: 4,
  },
});

export default PayWithSection;
