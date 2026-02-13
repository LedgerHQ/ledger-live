import React from "react";
import { TrackScreen } from "~/analytics";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { Flex } from "@ledgerhq/native-ui";
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
import { Image } from "react-native";
import { marginTop } from "styled-system";

const items = [
  {
    title: "rebornBuyDevice.0.title",
    desc: "rebornBuyDevice.0.desc",
    Icon: HandCoins,
  },
  {
    title: "rebornBuyDevice.1.title",
    desc: "rebornBuyDevice.1.desc",
    Icon: ShieldLock,
  },
  {
    title: "rebornBuyDevice.2.title",
    desc: "rebornBuyDevice.2.desc",
    Icon: Share2,
  },
];

type ViewProps = ReturnType<typeof useRebornBuyDeviceViewModel>;

function View({ t, isOpen, handleClose, setupDevice, buyLedger }: ViewProps) {
  return (
    <QueuedDrawerGorhom isRequestingToBeOpened={isOpen} snapPoints={["92%"]} onClose={handleClose}>
      <TrackScreen category="RebornDrawer" name="Upsell Flex" type="drawer" />

      <Flex>
        <Image
          source={require("../assets/ConnectDevice.png")}
          style={{ height: 200, width: "100%" }}
          accessibilityLabel="ledger devices showcase"
          resizeMode="contain"
        />
        <Text typography="heading3SemiBold" lineHeight="32px" lx={{ color: "base" }}>
          {t("rebornBuyDevice.title")}
        </Text>
        <Text typography="body2" lx={{ color: "muted", marginBottom: "s12" }}>
          {t("rebornBuyDevice.desc")}
        </Text>

        {items.map((item, idx) => (
          <ListItem key={idx}>
            <ListItemLeading>
              <item.Icon size={24} />

              <ListItemContent>
                <ListItemTitle>{t(item.title)}</ListItemTitle>
                <ListItemDescription>{t(item.desc)}</ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
          </ListItem>
        ))}

        <Button appearance="base" lx={{ marginTop: "s12" }} onPress={setupDevice}>
          {t("rebornBuyDevice.cta")}
        </Button>
        <Button
          appearance="gray"
          lx={{ marginTop: "s16", marginBottom: "s12" }}
          onPress={buyLedger}
        >
          {t("rebornBuyDevice.buyCta")}
        </Button>
      </Flex>
    </QueuedDrawerGorhom>
  );
}

const RebornBuyDeviceDrawer = () => <View {...useRebornBuyDeviceViewModel()} />;

export default RebornBuyDeviceDrawer;
