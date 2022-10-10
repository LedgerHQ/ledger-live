import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { BottomDrawer, Button, Text } from "@ledgerhq/native-ui";

import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { track, TrackScreen } from "../../../analytics";

type Props = {
  isOpened: boolean;
  onClose: () => void;
};

const PRE_SELECTED_CRYPTOS = ["ethereum", "polygon"];

export default function ReceiveNFTsModal({ onClose, isOpened }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const onClickContinue = useCallback(() => {
    track("button_clicked", {
      button: "Continue",
      drawer: "ReceiveNFTsModal",
    });
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveSelectCrypto,
      params: {
        filterCurrencyIds: PRE_SELECTED_CRYPTOS,
      },
    });
    onClose();
  }, [navigation, onClose]);

  const onPressClose = useCallback(() => {
    track("button_clicked", {
      button: "Close 'x'",
      drawer: "ReceiveNFTsModal",
    });
    onClose();
  }, [onClose]);

  return (
    <BottomDrawer
      testId="ReceiveNFTsModal"
      isOpen={isOpened}
      onClose={onPressClose}
    >
      <TrackScreen category="Add/receive NFTs" type="drawer" />
      <Text variant="h4" fontWeight="semiBold" fontSize="24px" mb={4}>
        {t("wallet.nftGallery.receiveModal.title")}
      </Text>

      {new Array(2).fill(null).map((_e, index) => (
        <Text variant="body" fontWeight="medium" color="neutral.c80">
          {t(`wallet.nftGallery.receiveModal.bullets.${index}`)}
        </Text>
      ))}

      <Button type="main" size="large" onPress={onClickContinue} my={8}>
        {t(`wallet.nftGallery.receiveModal.cta`)}
      </Button>
    </BottomDrawer>
  );
}
