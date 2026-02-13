import React from "react";
import { TrackScreen } from "~/analytics";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import useRebornBuyDeviceViewModel from "./useRebornBuyDeviceViewModel";
import {
  Text,
  ListItem,
  ListItemLeading,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import { HandCoins, ShieldLock, Share2 } from "@ledgerhq/lumen-ui-rnative/symbols";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

function View({ t, isOpen, handleClose, setupDevice, buyLedger }: Readonly<ViewProps>) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isOpen}
      enableDynamicSizing
      onClose={handleClose}
      showHandle
    >
      <BottomSheetView style={{ paddingBottom: bottomInset, paddingTop: 32 }}>
        <TrackScreen category="RebornDrawer" name="Upsell Flex" type="drawer" />

        <Image
          source={require("../assets/ConnectDevice.png")}
          style={{ height: 200, width: "100%", marginTop: 18, borderRadius: 6 }}
          accessibilityLabel="ledger devices showcase"
          resizeMode="stretch"
        />

        <Text typography="heading3SemiBold" lx={{ color: "base", marginTop: "s24" }}>
          {t("rebornBuyDevice.title")}
        </Text>
        <Text typography="body2" lx={{ color: "muted", marginBottom: "s12", marginTop: "s8" }}>
          {t("rebornBuyDevice.desc")}
        </Text>

        {items.map(item => (
          <ListItem key={item.id}>
            <ListItemLeading>
              <item.Icon size={24} />

              <ListItemContent>
                <ListItemTitle>{t(item.title)}</ListItemTitle>
                <ListItemDescription>{t(item.desc)}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
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
          lx={{ marginTop: "s16", marginBottom: "s12" }}
          onPress={buyLedger}
          testID="reborn-buy-device-buyCta"
        >
          {t("rebornBuyDevice.buyCta")}
        </Button>
      </BottomSheetView>
    </QueuedDrawerGorhom>
  );
}

const RebornBuyDeviceDrawer = () => <View {...useRebornBuyDeviceViewModel()} />;

export default RebornBuyDeviceDrawer;
