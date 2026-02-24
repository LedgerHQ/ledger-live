import React from "react";
import { useTranslation } from "react-i18next";
import TrackPage from "~/renderer/analytics/TrackPage";
import Text from "~/renderer/components/Text";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import Image from "~/renderer/components/Image";
import BuyDeviceHeader from "./BuyDevice.png";
import { HandCoins, ShieldLock, Wallet } from "@ledgerhq/lumen-ui-react/symbols";
import useBuyDeviceViewModel, { BuyDeviceViewProps } from "./useBuyDeviceViewModel";
import { Flex } from "@ledgerhq/react-ui/index";
import Box from "~/renderer/components/Box";

const items = [
  {
    id: "ownership",
    title: "buyDeviceModal.0.title",
    desc: "buyDeviceModal.0.desc",
    Icon: HandCoins,
  },
  {
    id: "trade",
    title: "buyDeviceModal.1.title",
    desc: "buyDeviceModal.1.desc",
    Icon: ShieldLock,
  },
  {
    id: "access",
    title: "buyDeviceModal.2.title",
    desc: "buyDeviceModal.2.desc",
    Icon: Wallet,
  },
];

const View = ({ isOpen, onClose, handleConnect, handleBuy }: BuyDeviceViewProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <TrackPage category="Modal" name="BuyDevice" />

      <DialogContent className="max-h-[90vh] rounded-xl" aria-describedby={undefined}>
        <DialogHeader onClose={onClose} />
        <DialogBody className="min-h-0 flex-1 gap-24 overflow-y-auto">
          <Image resource={BuyDeviceHeader} alt="Ledger devices" className="rounded-xl h-[200px]" />
          <Box relative>
            <Text className="heading-2-semi-bold text-base">{t("buyDeviceModal.title")}</Text>
            <Text className="body-2 text-muted mb-12">{t("buyDeviceModal.subtitle")}</Text>

            {items.map(item => (
              <ListItem key={item.id} className="pointer-events-none">
                <ListItemLeading>
                  <item.Icon size={24} />

                  <ListItemContent>
                    <ListItemTitle>{t(item.title)}</ListItemTitle>
                    <ListItemDescription>{t(item.desc)}</ListItemDescription>
                  </ListItemContent>
                </ListItemLeading>
              </ListItem>
            ))}
          </Box>
        </DialogBody>
        <DialogFooter className="justify-center w-full">
          <Flex alignItems="center" flexDirection="column" flexGrow={1} rowGap={2}>
            <Button appearance="base" size="lg" onClick={handleConnect} className="w-full">
              {t("buyDeviceModal.connectCTA")}
            </Button>

            <Button appearance="gray" size="lg" onClick={handleBuy} className="w-full">
              {t("buyDeviceModal.buyCTA")}
            </Button>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const BuyDevice = () => <View {...useBuyDeviceViewModel()} />;

export default BuyDevice;
