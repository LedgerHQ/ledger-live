import React, { memo, useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text, Button } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";
import WalletCoinsSupported from "~/icons/WalletCoinsSupported";
import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import { NavigatorName, ScreenName } from "~/const";
import { track, TrackScreen } from "~/analytics";
import { ContentCardLocation } from "~/dynamicContent/types";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";

const PortfolioEmptyState = ({ openAddAccountModal }: { openAddAccountModal: () => void }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useTheme();

  const goToReceiveFunds = useCallback(() => {
    track("button_clicked", { button: "Receive" });
    navigation.navigate(NavigatorName.ReceiveFunds);
  }, [navigation]);

  const goToBuyCrypto = useCallback(() => {
    track("button_clicked", {
      button: "Buy",
    });
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
    });
  }, [navigation]);

  return (
    <WalletTabSafeAreaView edges={["left", "right"]}>
      <TrackScreen category="Start CTAs" />
      <Flex alignItems="center" justifyContent="center">
        <WalletCoinsSupported moreAssetsBackgroundColor={colors.neutral.c100} />
      </Flex>
      <Text variant="h4" fontWeight="semiBold" textAlign="center" mt={8}>
        {t("portfolio.emptyState.title")}
      </Text>
      <Text variant="body" fontWeight="medium" color="neutral.c70" textAlign="center" mt={4}>
        {t("portfolio.emptyState.subtitle")}
      </Text>
      <ContentCardsLocation
        key="contentCardsLocationPortfolio"
        locationId={ContentCardLocation.Wallet}
        mt={7}
      />
      <Flex flexGrow={1} flexDirection="row" mt={9}>
        <Button
          type="main"
          size="large"
          iconName="Plus"
          iconPosition="left"
          mr={3}
          onPress={goToBuyCrypto}
          flex={1}
        >
          {t("account.buy")}
        </Button>
        <Button
          type="main"
          size="large"
          iconName="ArrowBottom"
          iconPosition="left"
          ml={3}
          onPress={goToReceiveFunds}
          flex={1}
          testID="receive-button"
        >
          {t("account.receive")}
        </Button>
      </Flex>
      <Flex flexDirection="row" alignItems="center" mt={7}>
        <Flex flex={1} borderBottomWidth={1} borderColor="neutral.c30" />
        <Text variant="subtitle" fontWeight="medium" color="neutral.c80">
          {t("portfolio.emptyState.addAccount")}
        </Text>
        <Flex flex={1} borderBottomWidth={1} borderColor="neutral.c30" />
      </Flex>
      <Button
        type="shade"
        outline
        size="large"
        iconName="Plus"
        iconPosition="left"
        onPress={openAddAccountModal}
        width={"100%"}
        mt={7}
        mb={11}
        testID="add-account-cta"
      >
        {t("account.emptyState.addAccountCta")}
      </Button>
    </WalletTabSafeAreaView>
  );
};

export default memo(PortfolioEmptyState);
