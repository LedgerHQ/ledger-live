import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";

import {
  BottomDrawer,
  Box,
  BoxedIcon,
  Button,
  Icons,
  Text,
} from "@ledgerhq/native-ui";
import styled from "styled-components/native";
import { track, TrackScreen } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";

type Props = {
  isOpened: boolean;
  onClose: () => void;
};
const HideNftDrawer = ({ isOpened, onClose }: Props) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const onClickContinue = useCallback(() => {
    track("button_clicked", {
      button: "Continue",
      drawer: "HideCollectionModal",
    });
    onClose();
    navigation.navigate(NavigatorName.WalletTab, {
      screen: ScreenName.NftGallery,
    });
  }, [navigation, onClose]);

  const onPressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: "HideCollectionModal",
    });
    onClose();
  }, [onClose]);

  return (
    <BottomDrawer
      testId="HideCollectionModal"
      isOpen={isOpened}
      onClose={onPressClose}
    >
      <TrackScreen category="Hide collection Drawer" type="drawer" />
      <Box alignItems="center">
        <BoxedIcon Icon={<Icons.EyeNoneMedium />} />

        <Text variant="h4" fontWeight="semiBold" fontSize="24px" my={4}>
          {t("wallet.nftGallery.hideNftModal.title")}
        </Text>

        <Text variant="body" fontWeight="medium" color="neutral.c80">
          {t("wallet.nftGallery.hideNftModal.desc")}
        </Text>
      </Box>
      <Button type="main" size="large" onPress={onClickContinue} mt={4} mb={2}>
        {t("common.continue")}
      </Button>

      <Button type="default" size="large" onPress={onClose}>
        {t("common.cancel")}
      </Button>
    </BottomDrawer>
  );
};

export default memo(HideNftDrawer);
