import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { ScrollView } from "react-native-gesture-handler";
import { Flex, Icons, Text, Box } from "@ledgerhq/native-ui";
import { StyleProp, ViewStyle } from "react-native";
import { snakeCase } from "lodash";
import { StackNavigationProp } from "@react-navigation/stack";
import { IconType } from "@ledgerhq/native-ui/components/Icon/type";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { NavigatorName, ScreenName } from "../../const";
import {
  accountsCountSelector,
  areAccountsEmptySelector,
} from "../../reducers/accounts";
import {
  hasOrderedNanoSelector,
  readOnlyModeEnabledSelector,
} from "../../reducers/settings";
import { Props as ModalProps } from "../QueuedDrawer";
import TransferButton from "../TransferButton";
import BuyDeviceBanner, { IMAGE_PROPS_SMALL_NANO } from "../BuyDeviceBanner";
import SetupDeviceBanner from "../SetupDeviceBanner";
import { track, useAnalytics } from "../../analytics";
import { sharedSwapTracking } from "../../screens/Swap/utils";

type ButtonItem = {
  title: string;
  description: string;
  tag?: string;
  Icon: IconType;
  onPress?: (() => void) | null;
  disabled?: boolean;
  event?: string;
  eventProperties?: Parameters<typeof track>[1];
  style?: StyleProp<ViewStyle>;
};

export default function TransferDrawer({
  onClose,
}: Omit<ModalProps, "isRequestingToBeOpened">) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const { page, track } = useAnalytics();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount: number = useSelector(accountsCountSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const areAccountsEmpty = useSelector(areAccountsEmptySelector);

  const walletConnectEntryPoint = useFeature("walletConnectEntryPoint");
  const stakePrograms = useFeature("stakePrograms");

  const onNavigate = useCallback(
    (name: string, options?: object) => {
      (
        navigation as StackNavigationProp<{ [key: string]: object | undefined }>
      ).navigate(name, options);

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

  const onStake = useCallback(() => {
    track("button_clicked", {
      button: "exchange",
      page,
      flow: "stake",
    });
    onNavigate(NavigatorName.StakeFlow);
  }, [onNavigate, page, track]);

  const onWalletConnect = useCallback(
    () =>
      onNavigate(NavigatorName.WalletConnect, {
        screen: ScreenName.WalletConnectConnect,
      }),
    [onNavigate],
  );

  const onSwap = useCallback(() => {
    track("button_clicked", {
      ...sharedSwapTracking,
      button: "swap",
      page,
    });
    onNavigate(NavigatorName.Swap, {
      screen: ScreenName.SwapForm,
    });
  }, [onNavigate, page, track]);
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

  const buttonsList: ButtonItem[] = [
    {
      eventProperties: {
        button: "transfer_send",
        page,
        drawer: "trade",
      },
      title: t("transfer.send.title"),
      description: t("transfer.send.description"),
      onPress:
        accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
          ? onSendFunds
          : null,
      Icon: Icons.ArrowTopMedium,
      disabled: !accountsCount || readOnlyModeEnabled || areAccountsEmpty,
    },
    {
      eventProperties: {
        button: "transfer_receive",
        page,
        drawer: "trade",
      },
      title: t("transfer.receive.title"),
      description: t("transfer.receive.description"),
      onPress: onReceiveFunds,
      Icon: Icons.ArrowBottomMedium,
      disabled: readOnlyModeEnabled,
    },
    {
      eventProperties: {
        button: "transfer_buy",
        page,
        drawer: "trade",
      },
      title: t("transfer.buy.title"),
      description: t("transfer.buy.description"),
      tag: t("common.popular"),
      Icon: Icons.PlusMedium,
      onPress: onBuy,
      disabled: readOnlyModeEnabled,
    },
    {
      eventProperties: {
        button: "transfer_sell",
        page,
        drawer: "trade",
      },
      title: t("transfer.sell.title"),
      description: t("transfer.sell.description"),
      Icon: Icons.MinusMedium,
      onPress:
        accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
          ? onSell
          : null,
      disabled: !accountsCount || readOnlyModeEnabled || areAccountsEmpty,
    },

    ...(stakePrograms?.enabled
      ? [
          {
            eventProperties: {
              button: "transfer_stake",
              page,
              drawer: "stake",
            },
            title: t("transfer.stake.title"),
            description: t("transfer.stake.description"),
            Icon: Icons.ClaimRewardsMedium,
            onPress: onStake,
            disabled: readOnlyModeEnabled,
          },
        ]
      : []),
    {
      eventProperties: {
        button: "transfer_swap",
        page,
        drawer: "trade",
      },
      title: t("transfer.swap.title"),
      description: t("transfer.swap.description"),
      Icon: Icons.BuyCryptoMedium,
      onPress:
        accountsCount > 0 && !readOnlyModeEnabled && !areAccountsEmpty
          ? onSwap
          : null,
      disabled: !accountsCount || readOnlyModeEnabled || areAccountsEmpty,
    },

    ...(walletConnectEntryPoint?.enabled
      ? [
          {
            eventProperties: {
              button: "transfer_walletConnect",
              page,
              drawer: "trade",
            },
            title: t("transfer.walletConnect.title"),
            description: t("transfer.walletConnect.description"),
            Icon: Icons.WalletConnectMedium,
            onPress: onWalletConnect,
            disabled: readOnlyModeEnabled,
          },
        ]
      : []),
  ];

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
    <Flex flexDirection="column" alignItems="flex-start" p={7} pt={9} flex={1}>
      <ScrollView alwaysBounceVertical={false} style={{ width: "100%" }}>
        {buttonsList.map((button, index) => (
          <Box mb={index === buttonsList.length - 1 ? 0 : 8} key={button.title}>
            <TransferButton {...button} />
          </Box>
        ))}
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
