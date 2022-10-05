import React, { memo, useCallback } from "react";
import { Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import Button from "../../../components/wrappedUi/Button";
import { urls } from "../../../config/urls";
import { NavigatorName, ScreenName } from "../../../const";
import Link from "../../../components/wrappedUi/Link";

const PRE_SELECTED_CRYPTOS = ["ethereum", "polygon"];

const NftGalleryEmptyState = () => {
  const { t } = useTranslation();

  const navigation = useNavigation();

  const navigateToReceive = useCallback(
    () =>
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectCrypto,
        params: {
          filterCurrencyIds: PRE_SELECTED_CRYPTOS,
        },
      }),
    [navigation],
  );

  const openSupportLink = useCallback(
    () => Linking.openURL(urls.nft.howToSecure),
    [],
  );

  return (
    <Flex flex={1} alignItems={"center"} justifyContent={"center"}>
      <Text
        variant={"h1Inter"}
        fontWeight={"semiBold"}
        color={"neutral.c100"}
        mb={6}
      >
        {t("wallet.nftGallery.empty.title")}
      </Text>
      <Button onPress={navigateToReceive} size={"large"} type={"main"} mb={6}>
        {t("wallet.nftGallery.empty.receive")}
      </Button>
      <Link
        onPress={openSupportLink}
        Icon={Icons.ExternalLinkMedium}
        iconPosition="right"
      >
        {t("wallet.nftGallery.empty.supportLink")}
      </Link>
    </Flex>
  );
};

export default memo(NftGalleryEmptyState);
