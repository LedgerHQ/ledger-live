import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";

import { Flex, Icons, Text, Box } from "@ledgerhq/native-ui";
import { ScrollView } from "react-native";
import { snakeCase } from "lodash";
import { NavigatorName, ScreenName } from "../../const";
import {
  accountsCountSelector,
  hasLendEnabledAccountsSelector,
  accountsSelector,
} from "../../reducers/accounts";
import {
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "../../reducers/settings";
import { Props as ModalProps } from "../BottomModal";
import TransferButton from "./TransferButton";
import BuyDeviceBanner, { IMAGE_PROPS_SMALL_NANO } from "../BuyDeviceBanner";
import SetupDeviceBanner from "../SetupDeviceBanner";
import { useAnalytics } from "../../analytics";

export default function TransferDrawer({ onClose }: ModalProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { page } = useAnalytics();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const lendingEnabled = useSelector(hasLendEnabledAccountsSelector);
  const accounts = useSelector(accountsSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const areAccountsEmpty = useMemo(
    () => accounts.every(isAccountEmpty),
    [accounts],
  );

  const onNavigate = useCallback(
    (name: string, options?: { [key: string]: any }) => {
      navigation.navigate(name, options);

      if (onClose) {
        onClose();
      }
    },
    [navigation, onClose],
  );

  const onSendFunds = useCallback(
    () =>
      onNavigate(NavigatorName.SendFunds, {
        screen: ScreenName.SendCoin,
      }),
    [onNavigate],
  );
  const onReceiveFunds = useCallback(
    () => onNavigate(NavigatorName.ReceiveFunds),
    [onNavigate],
  );
  const onSwap = useCallback(
    () =>
      onNavigate(NavigatorName.Swap, {
        screen: "SwapForm",
      }),
    [onNavigate],
  );
  const onBuy = useCallback(
    () =>
      onNavigate(NavigatorName.Exchange, { screen: ScreenName.ExchangeBuy }),
    [onNavigate],
  );
  const onSell = useCallback(
    () =>
      onNavigate(NavigatorName.Exchange, { screen: ScreenName.ExchangeSell }),
    [onNavigate],
  );
  const onLending = useCallback(
    () =>
      onNavigate(NavigatorName.Lending, {
        screen: ScreenName.LendingDashboard,
      }),
    [onNavigate],
  );

  const buttons = (
    <>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_send",
            page,
            drawer: "trade",
          }}
          title={t("transfer.send.title")}
          description={t("transfer.send.description")}
          onPress={
            accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
              ? onSendFunds
              : null
          }
          Icon={Icons.ArrowTopMedium}
          disabled={!accountsCount || readOnlyModeEnabled || areAccountsEmpty}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_receive",
            page,
            drawer: "trade",
          }}
          title={t("transfer.receive.title")}
          description={t("transfer.receive.description")}
          onPress={onReceiveFunds}
          Icon={Icons.ArrowBottomMedium}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_buy",
            page,
            drawer: "trade",
          }}
          title={t("transfer.buy.title")}
          description={t("transfer.buy.description")}
          tag={t("common.popular")}
          Icon={Icons.PlusMedium}
          onPress={onBuy}
          disabled={readOnlyModeEnabled}
        />
      </Box>
      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_sell",
            page,
            drawer: "trade",
          }}
          title={t("transfer.sell.title")}
          description={t("transfer.sell.description")}
          Icon={Icons.MinusMedium}
          onPress={
            accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
              ? onSell
              : null
          }
          disabled={!accountsCount || readOnlyModeEnabled || areAccountsEmpty}
        />
      </Box>

      <Box mb={8}>
        <TransferButton
          eventProperties={{
            button: "transfer_swap",
            page,
            drawer: "trade",
          }}
          title={t("transfer.swap.title")}
          description={t("transfer.swap.description")}
          Icon={Icons.BuyCryptoMedium}
          onPress={
            accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
              ? onSwap
              : null
          }
          disabled={!accountsCount || readOnlyModeEnabled || areAccountsEmpty}
        />
      </Box>

      {lendingEnabled ? (
        <Box mb={8}>
          <TransferButton
            eventProperties={{
              button: "transfer_lending",
              page,
              drawer: "trade",
            }}
            title={t("transfer.lending.titleTransferTab")}
            description={t("transfer.lending.descriptionTransferTab")}
            tag={t("common.popular")}
            Icon={Icons.LendMedium}
            onPress={
              accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
                ? onLending
                : null
            }
            disabled={!accountsCount || readOnlyModeEnabled || areAccountsEmpty}
          />
        </Box>
      ) : null}
    </>
  );

  const bannerEventProperties = useMemo(
    () => ({
      banner: "You'll need a nano",
      button: "Buy a device",
      drawer: "transfer",
      page,
    }),
    [page],
  );

  let screen = "Wallet";

  // TODO : Find a way to get Assets and Asset screen names
  // * Currently, these 2 screen names are under NavigatorName.Portfolio's navigator
  switch (page) {
    case snakeCase(NavigatorName.Portfolio): {
      screen = "Wallet";
      break;
    }
    case snakeCase(NavigatorName.Market): {
      screen = "Market";
      break;
    }
    case snakeCase(NavigatorName.Discover): {
      screen = "Discover";
      break;
    }
    default: {
      break;
    }
  }

  return (
    <Flex flexDirection="column" alignItems="flex-start" p={7} pt={9}>
      <ScrollView alwaysBounceVertical={false} style={{ width: "100%" }}>
        {buttons}
      </ScrollView>
      {readOnlyModeEnabled && !hasOrderedNano && (
        <BuyDeviceBanner
          topLeft={
            <Text
              color="primary.c40"
              uppercase
              mb={3}
              fontSize="11px"
              fontWeight="semiBold"
            >
              {t("buyDevice.bannerTitle2")}
            </Text>
          }
          style={{ marginTop: 36, paddingTop: 13.5, paddingBottom: 13.5 }}
          buttonLabel={t("buyDevice.bannerButtonTitle2")}
          buttonSize="small"
          event="button_clicked"
          eventProperties={bannerEventProperties}
          screen={screen}
          {...IMAGE_PROPS_SMALL_NANO}
        />
      )}
      {readOnlyModeEnabled && hasOrderedNano ? (
        <Box mt={8} width={"100%"}>
          <SetupDeviceBanner screen={screen} />
        </Box>
      ) : null}
    </Flex>
  );
}
