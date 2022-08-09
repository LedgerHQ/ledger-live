import React, { memo, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import WalletCoinsSupported from "../../icons/WalletCoinsSupported";
import { NavigatorName, ScreenName } from "../../const";

const PortfolioEmptyState = ({ openAddAccountModal }: { openAddAccountModal: () => void }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const goToReceiveFunds = useCallback(() => {
    navigation.navigate(NavigatorName.ReceiveFunds, {
      // screen: ScreenName.ReceiveConnectDevice,
    });
  }, [navigation]);

  const goToBuyCrypto = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
    });
  }, [navigation]);

  return (
    <Flex flex={1} alignItems="center" justifyContent="center">
      <WalletCoinsSupported />
      <Flex mt={8} alignItems="center" justifyContent="center">
        <Text variant="h4" fontWeight="semiBold" textAlign="center">
          {t("portfolio.emptyState.title")}
        </Text>
        <Text
          variant="body"
          fontWeight="medium"
          color="neutral.c70"
          textAlign="center"
          mt={4}
        >
          {t("portfolio.emptyState.subtitle")}
        </Text>
      </Flex>
      <Flex flex={1} flexDirection="row" mt={9}>
        <Flex width="50%" pl={6} pr={3}>
          <Button
            type="main"
            size="large"
            iconName="Plus"
            iconPosition="left"
            mr={3}
            onPress={goToBuyCrypto}
          >
            {t("account.buy")}
          </Button>
        </Flex>
        <Flex width="50%" pl={3} pr={6}>
          <Button
            type="main"
            size="large"
            iconName="ArrowBottom"
            iconPosition="left"
            ml={3}
            onPress={goToReceiveFunds}
          >
            {t("account.receive")}
          </Button>
        </Flex>
      </Flex>
      <Flex flexDirection="row" alignItems="center" mt={7} mx={6}>
        <Flex flex={1} borderBottomWidth={1} borderColor="neutral.c30" />
        <Text variant="subtitle" fontWeight="medium" color="neutral.c80" mx={6}>
          {t("portfolio.emptyState.addAccount")}
        </Text>
        <Flex flex={1} borderBottomWidth={1} borderColor="neutral.c30" />
      </Flex>
      <Flex width="100%" mt={7} px={6}>
        <Button
          type="shade"
          outline
          size="large"
          iconName="Plus"
          iconPosition="left"
          onPress={openAddAccountModal}
        >
          {t("account.emptyState.addAccountCta")}
        </Button>
      </Flex>
    </Flex>
  );
};

export default memo(PortfolioEmptyState);
