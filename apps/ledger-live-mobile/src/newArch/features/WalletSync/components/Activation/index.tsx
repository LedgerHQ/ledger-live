import React from "react";
import Actions from "./Actions";
import IconsHeader from "./IconsHeader";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import { useInitMemberCredentials } from "../../hooks/useInitMemberCredentials";
import QueuedDrawer from "~/components/QueuedDrawer";
import ChooseSyncMethod from "../../screens/Synchronize/ChooseMethod";
import QrCodeMethod from "../../screens/Synchronize/QrCodeMethod";
import { useWindowDimensions } from "react-native";
import DrawerHeader from "../Synchronize/DrawerHeader";

type Props<T extends boolean> = T extends true
  ? { isInsideDrawer: T; openSyncMethodDrawer: () => void }
  : { isInsideDrawer?: T; openSyncMethodDrawer?: undefined };

const Activation: React.FC<Props<boolean>> = ({ isInsideDrawer, openSyncMethodDrawer }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const maxDrawerHeight = height - 180;

  useInitMemberCredentials();

  const [isChooseMethodDrawerOpen, setIsChooseMethodDrawerOpen] = React.useState(false);
  const [isQrCodeDrawerOpen, setIsQrCodeDrawerOpen] = React.useState(false);

  const onPressSyncAccounts = () => {
    isInsideDrawer ? openSyncMethodDrawer() : setIsChooseMethodDrawerOpen(true);
  };

  const onPressHasAlreadyCreatedAKey = () => {
    isInsideDrawer ? openSyncMethodDrawer() : setIsChooseMethodDrawerOpen(true);
  };

  const onPressCloseDrawer = () => {
    setIsChooseMethodDrawerOpen(false);
  };

  const onScanMethodPress = () => {
    setIsChooseMethodDrawerOpen(false);
    setIsQrCodeDrawerOpen(true);
  };

  const onPressCloseQrCodeDrawer = () => {
    setIsQrCodeDrawerOpen(false);
    setIsChooseMethodDrawerOpen(true);
  };

  const CustomDrawerHeader = () => {
    return <DrawerHeader onClose={onPressCloseQrCodeDrawer} />;
  };

  return (
    <Flex flexDirection="column" justifyContent="center" alignItems="center" rowGap={24}>
      <TrackScreen />
      <IconsHeader />
      <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={16}>
        <Text variant="h4" textAlign="center" lineHeight="32.4px">
          {t("walletSync.activation.screen.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          textAlign="center"
          color={colors.neutral.c70}
          alignSelf={"center"}
          maxWidth={330}
          numberOfLines={3}
        >
          {t("walletSync.activation.screen.description")}
        </Text>
      </Flex>
      <Actions
        onPressHasAlreadyCreatedAKey={onPressHasAlreadyCreatedAKey}
        onPressSyncAccounts={onPressSyncAccounts}
      />
      {!isInsideDrawer && (
        <>
          <QueuedDrawer
            isRequestingToBeOpened={isChooseMethodDrawerOpen}
            onClose={onPressCloseDrawer}
          >
            <ChooseSyncMethod onScanMethodPress={onScanMethodPress} />
          </QueuedDrawer>
          <QueuedDrawer
            isRequestingToBeOpened={isQrCodeDrawerOpen}
            onClose={onPressCloseQrCodeDrawer}
            CustomHeader={CustomDrawerHeader}
          >
            <Flex maxHeight={maxDrawerHeight}>
              <QrCodeMethod />
            </Flex>
          </QueuedDrawer>
        </>
      )}
    </Flex>
  );
};

export default Activation;
