import React from "react";
import { TrackScreen } from "~/analytics";
import useRebornBuyDeviceViewModel from "./useRebornBuyDeviceViewModel";
import {
  Text,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  Button,
  BottomSheetView,
  BottomSheetHeader,
  Box,
} from "@ledgerhq/lumen-ui-rnative";
import { HandCoins, ShieldLock, Share2 } from "@ledgerhq/lumen-ui-rnative/symbols";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueuedDrawerGorhom, {
  BottomSheetView as GorhomBottomSheetView,
} from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";

const items = [
  {
    id: "ownership",
    title: "rebornBuyDevice.0.title",
    desc: "rebornBuyDevice.0.desc",
    Icon: HandCoins,
  },
  {
    id: "trade",
    title: "rebornBuyDevice.1.title",
    desc: "rebornBuyDevice.1.desc",
    Icon: ShieldLock,
  },
  {
    id: "access",
    title: "rebornBuyDevice.2.title",
    desc: "rebornBuyDevice.2.desc",
    Icon: Share2,
  },
];

type ViewProps = ReturnType<typeof useRebornBuyDeviceViewModel>;

function View({ t, setupDevice, buyLedger }: Readonly<Omit<ViewProps, "isOpen" | "handleClose">>) {
  return (
    <>
      <TrackScreen category="RebornDrawer" name="Upsell Flex" type="drawer" />

      <Image
        source={require("../assets/ConnectDevice.png")}
        style={{ height: 200, width: "100%", marginTop: 6, borderRadius: 6 }}
        accessibilityLabel="ledger devices showcase"
        resizeMode="cover"
      />

      <Text typography="heading3SemiBold" lx={{ color: "base", marginTop: "s24" }}>
        {t("rebornBuyDevice.title")}
      </Text>
      <Text typography="body2" lx={{ color: "muted", marginBottom: "s12", marginTop: "s8" }}>
        {t("rebornBuyDevice.desc")}
      </Text>

      {items.map(item => (
        <Box
          key={item.id}
          lx={{
            flexDirection: "row",
            alignItems: "center",
            height: "s64",
            width: "full",
            gap: "s16",
            borderRadius: "md",
            backgroundColor: "baseTransparent",
            paddingHorizontal: "s8",
            paddingVertical: "s12",
          }}
        >
          <ListItemLeading>
            <item.Icon size={24} />

            <ListItemContent>
              <ListItemTitle>{t(item.title)}</ListItemTitle>
              <ListItemDescription>{t(item.desc)}</ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </Box>
      ))}

      <Button
        appearance="base"
        size="lg"
        lx={{ marginTop: "s24" }}
        onPress={setupDevice}
        testID="reborn-buy-device-cta"
      >
        {t("rebornBuyDevice.cta")}
      </Button>
      <Button
        appearance="gray"
        size="lg"
        lx={{ marginTop: "s16" }}
        onPress={buyLedger}
        testID="reborn-buy-device-buyCta"
      >
        {t("rebornBuyDevice.buyCta")}
      </Button>
    </>
  );
}

function WrapperView({ isOpen, handleClose, ...viewProps }: Readonly<ViewProps>) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  if (isEnabled) {
    return (
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isOpen}
        onClose={handleClose}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 12 }}>
          <BottomSheetHeader />
          <View {...viewProps} />
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    );
  }

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={handleClose}
      showHandle
    >
      <GorhomBottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 32 }}>
        <View {...viewProps} />
      </GorhomBottomSheetView>
    </QueuedDrawerGorhom>
  );
}

const RebornBuyDeviceDrawer = () => <WrapperView {...useRebornBuyDeviceViewModel()} />;

export default RebornBuyDeviceDrawer;
