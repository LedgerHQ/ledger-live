import React, { useMemo, useCallback } from "react";
import { Text, Flex, Icons, Box } from "@ledgerhq/native-ui";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/index";
import { getAllSupportedCryptoCurrencyTickers } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/helpers";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import CoinsIcon from "./CoinsIcon";
import { useProviders } from "../../screens/Swap/Form";
import TransferButton from "../TransferButton";
import { useAnalytics } from "../../analytics";
import { NavigatorName, ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";

export default function NoFunds({ route }) {
  const { t } = useTranslation();
  const { account, parentAccount } = route.params;
  const rampCatalog = useRampCatalog();
  const { providers, storedProviders } = useProviders();
  const navigation = useNavigation();
  const onRampAvailableTickers = useMemo(() => {
    if (!rampCatalog.value) {
      return [];
    }
    return getAllSupportedCryptoCurrencyTickers(rampCatalog.value.onRamp);
  }, [rampCatalog.value]);

  const swapAvailableIds = useMemo(() => {
    return providers || storedProviders
      ? (providers || storedProviders)
          .map(({ pairs }) => pairs.map(({ from, to }) => [from, to]))
          .flat(2)
      : [];
  }, [providers, storedProviders]);

  const currency = parentAccount?.currency || account.currency;
  const availableOnReceive = true;
  const availableOnBuy =
    currency && onRampAvailableTickers.includes(currency.ticker.toUpperCase());
  const availableOnSwap = useMemo(() => {
    return currency && swapAvailableIds.includes(currency.id);
  }, [currency, swapAvailableIds]);

  const { page, track } = useAnalytics();
  const onNavigate = useCallback(
    (name: string, options?: object) => {
      (
        navigation as StackNavigationProp<{ [key: string]: object | undefined }>
      ).navigate(name, options);
    },
    [navigation],
  );

  const onReceiveFunds = useCallback(() => {
    track("button_clicked", {
      button: "receive",
      page,
    });
    onNavigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: {
        accountId: account.id,
        parentId: parentAccount?.id,
        currency,
      },
    });
  }, [account.id, currency, onNavigate, page, parentAccount?.id, track]);

  const onSwap = useCallback(() => {
    track("button_clicked", {
      button: "swap",
      page,
    });
    onNavigate(NavigatorName.Swap, {
      screen: ScreenName.SwapForm,
    });
  }, [onNavigate, page, track]);

  const onBuy = useCallback(() => {
    track("button_clicked", {
      button: "buy",
      page,
    });
    onNavigate(NavigatorName.Exchange, { screen: ScreenName.ExchangeBuy });
  }, [onNavigate, page, track]);

  const buttonsList: ButtonItem[] = [
    {
      title: t("stake.noFundsModal.options.buy.title"),
      description: t("stake.noFundsModal.options.buy.body"),
      Icon: Icons.PlusMedium,
      onPress: onBuy,
      disabled: !availableOnBuy,
      rightArrow: true,
    },
    {
      title: t("stake.noFundsModal.options.swap.title"),
      description: t("stake.noFundsModal.options.swap.body"),
      tag: t("stake.noFundsModal.options.swap.label"),
      Icon: Icons.BuyCryptoMedium,
      onPress: onSwap,
      disabled: !availableOnSwap,
      rightArrow: true,
    },
    {
      title: t("stake.noFundsModal.options.receive.title"),
      description: t("stake.noFundsModal.options.receive.body"),
      onPress: onReceiveFunds,
      Icon: Icons.ArrowBottomMedium,
      disabled: !availableOnReceive,
      rightArrow: true,
    },
  ];

  return (
    <Flex style={{ height: "100%" }} justifyContent="center">
      <TrackScreen category="NoFundsFlow" name="ServiceModal" />
      <Flex mx={45}>
        <Flex alignItems="center">
          <CoinsIcon />
        </Flex>
        <Text variant="h4" textAlign="center" mt={10}>
          {t("stake.noFundsModal.text", { coin: currency.ticker })}
        </Text>
        <Text variant="body" textAlign="center" color="neutral.c70" mt={6}>
          {t("stake.noFundsModal.description", { coin: currency.name })}
        </Text>
      </Flex>
      <Flex my={8} mx={6}>
        {buttonsList
          .filter(button => !button.disabled)
          .map((button, index) => (
            <Box
              mb={index === buttonsList.length - 1 ? 0 : 8}
              key={button.title}
            >
              <TransferButton {...button} />
            </Box>
          ))}
      </Flex>
    </Flex>
  );
}
