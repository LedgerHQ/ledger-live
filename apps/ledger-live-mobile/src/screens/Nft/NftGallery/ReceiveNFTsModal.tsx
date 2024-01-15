import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button, Text } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { Linking, View } from "react-native";
import Svg, { G, Path, Rect, Mask } from "react-native-svg";
import { NavigatorName, ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import { urls } from "~/utils/urls";
import QueuedDrawer from "~/components/QueuedDrawer";

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
      drawer: "Confirm Receive NFT",
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
      drawer: "Confirm Receive NFT",
    });
    onClose();
  }, [onClose]);

  const openSupportLink = useCallback(() => {
    track("url_clicked", {
      name: "i'd like to learn more",
      url: urls.nft.howToSecure,
      drawer: "Confirm Receive NFT",
    });
    Linking.openURL(urls.nft.howToSecure);
  }, []);

  const onClickLearnMore = useCallback(() => {
    track("button_clicked", {
      button: "Learn More",
      drawer: "Confirm Receive NFT",
    });
    openSupportLink();
    onClose();
  }, [onClose, openSupportLink]);

  return (
    <QueuedDrawer
      title={t("wallet.nftGallery.receiveModal.title")}
      isRequestingToBeOpened={isOpened}
      onClose={onPressClose}
      Icon={<EthPolygonIcons />}
    >
      <TrackScreen category="Confirm Receive NFT" type="drawer" refreshSource={false} />
      <View testID="wallet-nft-gallery-receive-modal">
        {new Array(2).fill(null).map((_e, index) => (
          <Text variant="body" fontWeight="medium" color="neutral.c80" key={index}>
            {t(`wallet.nftGallery.receiveModal.bullets.${index}`)}
          </Text>
        ))}

        <Button
          testID="wallet-nft-gallery-receive-modal-continue-button"
          type="main"
          size="large"
          onPress={onClickContinue}
          mt={8}
          mb={4}
        >
          {t("wallet.nftGallery.receiveModal.cta")}
        </Button>

        <Button size="large" type="default" onPress={onClickLearnMore}>
          {t("wallet.nftGallery.receiveModal.info")}
        </Button>
      </View>
    </QueuedDrawer>
  );
}

const EthPolygonIcons = () => {
  return (
    <Svg width="77" height="52" viewBox="0 0 77 52" fill="none">
      <Mask
        id="mask0_10885_163131"
        // maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="77"
        height="52"
      >
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M52.5 48C65.7548 48 76.5 37.2548 76.5 24C76.5 10.7452 65.7548 0 52.5 0C47.593 0 43.03 1.47261 39.2288 4H0.5V52H48.5V47.6682C49.8008 47.8864 51.1371 48 52.5 48ZM28.5 24C28.5 35.892 37.1491 45.7639 48.5 47.6682V4H39.2288C32.762 8.29969 28.5 15.6521 28.5 24Z"
          fill="#C4C4C4"
        />
      </Mask>
      <G mask="url(#mask0_10885_163131)">
        <Rect x="0.5" y="4" width="40" height="40" rx="20" fill="#0EBDCD" />
        <Path d="M26.7479 23.5L20.4991 14L14.25 23.5L20.4991 27.128L26.7479 23.5Z" fill="white" />
        <Path
          d="M20.4991 33.9999L26.7521 25.3489L20.4991 28.9764L14.25 25.3489L20.4991 33.9999Z"
          fill="white"
        />
      </G>
      <Rect x="32.5" y="4" width="40" height="40" rx="20" fill="#8247E5" />
      <Path
        d="M57.5922 20.6935C57.2232 20.4778 56.7435 20.4778 56.3377 20.6935L53.4594 22.3467L51.5037 23.425L48.6255 25.0782C48.2565 25.2939 47.7767 25.2939 47.3708 25.0782L45.083 23.7843C44.714 23.5687 44.4557 23.1734 44.4557 22.7421V20.1903C44.4557 19.759 44.6771 19.3636 45.083 19.148L47.3339 17.8901C47.7029 17.6744 48.1827 17.6744 48.5886 17.8901L50.8395 19.148C51.2085 19.3636 51.4668 19.759 51.4668 20.1903V21.8436L53.4225 20.7294V19.0761C53.4225 18.6448 53.2011 18.2495 52.7952 18.0338L48.6255 15.6617C48.2565 15.4461 47.7767 15.4461 47.3708 15.6617L43.1273 18.0338C42.7214 18.2495 42.5 18.6448 42.5 19.0761V23.8563C42.5 24.2875 42.7214 24.6829 43.1273 24.8986L47.3708 27.2706C47.7398 27.4863 48.2196 27.4863 48.6255 27.2706L51.5037 25.6533L53.4594 24.5391L56.3377 22.9218C56.7066 22.7061 57.1863 22.7061 57.5922 22.9218L59.8432 24.1797C60.2121 24.3954 60.4704 24.7907 60.4704 25.222V27.7738C60.4704 28.2051 60.2491 28.6004 59.8432 28.8161L57.5922 30.11C57.2232 30.3256 56.7435 30.3256 56.3377 30.11L54.0867 28.852C53.7177 28.6364 53.4594 28.241 53.4594 27.8097V26.1565L51.5037 27.2706V28.9239C51.5037 29.3552 51.7251 29.7505 52.131 29.9662L56.3745 32.3383C56.7435 32.5539 57.2232 32.5539 57.6291 32.3383L61.8727 29.9662C62.2417 29.7505 62.5 29.3552 62.5 28.9239V24.1437C62.5 23.7125 62.2786 23.3172 61.8727 23.1015L57.5922 20.6935Z"
        fill="white"
      />
    </Svg>
  );
};
