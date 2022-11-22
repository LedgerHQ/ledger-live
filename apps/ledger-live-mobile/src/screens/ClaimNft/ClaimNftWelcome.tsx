import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Flex, Icons, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";

const BulletItem = ({ textKey }: { textKey: string }) => {
  const { t } = useTranslation();
  return (
    <Flex flexDirection="row" mb={6}>
      <Icons.CircledCheckSolidRegular color="primary.c80" />
      <Text ml={4}>{t(textKey)}</Text>
    </Flex>
  );
};

const ClaimNftWelcome = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const handleGoToQrScan = useCallback(
    () =>
      navigation.navigate(NavigatorName.ClaimNft, {
        screen: ScreenName.ClaimNftQrScan,
      }),
    [navigation],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
      <Flex flex={1}>
        <Flex
          backgroundColor="neutral.c40"
          alignItems="center"
          justifyContent="center"
          height={250}
          width="100%"
        >
          <Text>illustration placeholder NFT</Text>
        </Flex>
        <Flex flex={1} px={7}>
          <Text variant="h4" fontWeight="semiBold" mt={7} textAlign="center">
            {t("claimNft.welcomePage.title")}
          </Text>
          <Flex mt={6}>
            <Text color="neutral.c70" mb={6}>
              {t("claimNft.welcomePage.description.title")}
            </Text>
            <BulletItem textKey={"claimNft.welcomePage.description.1"} />
            <BulletItem textKey={"claimNft.welcomePage.description.2"} />
            <BulletItem textKey={"claimNft.welcomePage.description.3"} />
          </Flex>
          <Flex>
            <Button type="main" onPress={handleGoToQrScan}>
              {t("claimNft.welcomePage.claimButton")}
            </Button>
            <Button>{t("claimNft.welcomePage.backButton")}</Button>
          </Flex>
        </Flex>
      </Flex>
    </SafeAreaView>
  );
};

export default ClaimNftWelcome;
