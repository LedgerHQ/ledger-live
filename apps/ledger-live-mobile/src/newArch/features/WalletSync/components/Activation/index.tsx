import React from "react";
import Actions from "./Actions";
import IconsHeader from "./IconsHeader";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import { TrackScreen } from "~/analytics";
import Drawer from "LLM/components/Dummy/Drawer";

type Props<T extends boolean> = T extends true
  ? { isInsideDrawer: T; openSyncMethodDrawer: () => void }
  : { isInsideDrawer?: T; openSyncMethodDrawer?: undefined };

const Activation: React.FC<Props<boolean>> = ({ isInsideDrawer, openSyncMethodDrawer }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  const onPressSyncAccounts = () => {
    // do nothing for the moment
  };

  const onPressHasAlreadyCreatedAKey = () => {
    isInsideDrawer ? openSyncMethodDrawer() : setIsDrawerOpen(true);
  };

  const onPressCloseDrawer = () => {
    setIsDrawerOpen(false);
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
      {!isInsideDrawer && <Drawer isOpen={isDrawerOpen} handleClose={onPressCloseDrawer} />}
    </Flex>
  );
};

export default Activation;
