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

type Props<T extends boolean> = T extends true
  ? { isInsideDrawer: T; openSyncMethodDrawer: () => void }
  : { isInsideDrawer?: T; openSyncMethodDrawer?: undefined };

const Activation: React.FC<Props<boolean>> = ({ isInsideDrawer, openSyncMethodDrawer }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  useInitMemberCredentials();
  const [isChooseMethodDrawerOpen, setIsChooseMethodDrawerOpen] = React.useState(false);

  const onPressSyncAccounts = () => {
    isInsideDrawer ? openSyncMethodDrawer() : setIsChooseMethodDrawerOpen(true);
  };

  const onPressHasAlreadyCreatedAKey = () => {
    isInsideDrawer ? openSyncMethodDrawer() : setIsChooseMethodDrawerOpen(true);
  };

  const onPressCloseDrawer = () => {
    setIsChooseMethodDrawerOpen(false);
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
        <QueuedDrawer
          isRequestingToBeOpened={isChooseMethodDrawerOpen}
          onClose={onPressCloseDrawer}
        >
          <ChooseSyncMethod />
        </QueuedDrawer>
      )}
    </Flex>
  );
};

export default Activation;
