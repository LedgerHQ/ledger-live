import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  BottomDrawer,
  Button,
  CryptoIcon,
  Flex,
  Text,
} from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { Linking } from "react-native";
import styled, { useTheme } from "styled-components/native";
import { NavigatorName, ScreenName } from "../../../const";
import { track, TrackScreen } from "../../../analytics";
import { urls } from "../../../config/urls";

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

  const openSupportLink = useCallback(
    () => Linking.openURL(urls.nft.howToSecure),
    [],
  );

  const onClickLearnMore = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      drawer: "ReceiveNFTsModal",
    });
    openSupportLink();
    onClose();
  }, [onClose, openSupportLink]);

  return (
    <BottomDrawer
      testId="ReceiveNFTsModal"
      isOpen={isOpened}
      onClose={onPressClose}
    >
      <TrackScreen category="Add/receive NFTs" type="drawer" />
      <ChainedIcons />
      <Text variant="h4" fontWeight="semiBold" fontSize="24px" mt={2} mb={4}>
        {t("wallet.nftGallery.receiveModal.title")}
      </Text>

      {new Array(2).fill(null).map((_e, index) => (
        <Text variant="body" fontWeight="medium" color="neutral.c80">
          {t(`wallet.nftGallery.receiveModal.bullets.${index}`)}
        </Text>
      ))}

      <Button type="main" onPress={onClickContinue} mt={8} mb={4}>
        {t("wallet.nftGallery.receiveModal.cta")}
      </Button>

      <Button size="large" type="default" onPress={onClickLearnMore}>
        {t("wallet.nftGallery.receiveModal.info")}
      </Button>
    </BottomDrawer>
  );
}

function ChainedIcons() {
  const { colors } = useTheme();

  return (
    <Flex
      flexDirection="row"
      justifyContent={"center"}
      alignItems="center"
      ml={4}
    >
      <CryptoIcon name="ETH" size={40} circleIcon />
      <IconContainer
        zIndex={1}
        size={50}
        borderColor={colors.background.drawer}
        right={10}
      >
        <CryptoIcon name="MATIC" size={40} circleIcon />
      </IconContainer>
    </Flex>
  );
}

const IconContainer = styled(Flex).attrs(
  (p: {
    size: number;
    borderColor: string;
    backgroundColor: string;
    zIndex: number;
    right: number;
  }) => ({
    right: `${p.right}px`,
    alignItems: "center",
    justifyContent: "center",
    heigth: p.size,
    width: p.size,
    border: `5px solid ${p.borderColor}`,
    borderRadius: 50.0,
    backgroundColor: p.backgroundColor,
  }),
)<{ size: number }>``;
