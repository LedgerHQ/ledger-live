import React, { useRef } from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { Icons } from "@ledgerhq/native-ui/index";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "./OptionButton";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { isCryptoOrTokenCurrency } from "LLM/utils/isCryptoOrTokenCurrency";
import { isObject } from "LLM/utils/isObject";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { useOpenReceiveDrawer } from "LLM/features/Receive";

// Fiat provider manifest ID for Noah integration
const FIAT_PROVIDER_MANIFEST_ID = "noah";

type EntryScreens =
  | ScreenName.ReceiveSelectCrypto
  | ScreenName.ReceiveSelectAccount
  | ScreenName.ReceiveConfirmation;

type EntryScreenProps = {
  [K in EntryScreens]: StackNavigatorProps<ReceiveFundsStackParamList, K>;
}[EntryScreens];

export default function ReceiveFundsOptions(props: EntryScreenProps) {
  const { t } = useTranslation();
  const { navigation } = props;
  const isNavigatingRef = useRef(false);
  const { handleOpenReceiveDrawer, isModularDrawerEnabled } = useOpenReceiveDrawer({
    currency: isCryptoOrTokenCurrency(props.route.params?.currency)
      ? props.route.params?.currency
      : undefined,
    sourceScreenName: props.route.name,
  });

  function handleGoToFiat() {
    isNavigatingRef.current = true;
    navigation.replace(ScreenName.ReceiveProvider, {
      manifestId: FIAT_PROVIDER_MANIFEST_ID,
      fromMenu: true,
    });
  }

  function handleGoToCrypto() {
    if (isModularDrawerEnabled) {
      handleClose();
      handleOpenReceiveDrawer();
      return;
    }

    isNavigatingRef.current = true;
    typesafeNavigation(props);
  }

  function handleClose() {
    if (!isNavigatingRef.current) {
      navigation.goBack();
    }
  }

  return (
    <QueuedDrawerGorhom isForcingToBeOpened snapPoints={["35%", "55%"]} onClose={handleClose}>
      <TrackScreen category="Deposit" name="Options" />
      <Text textAlign="center" fontSize={24} mb={5}>
        {t("transfer.receive.title")}
      </Text>
      <OptionButton
        onPress={handleGoToFiat}
        title={t("transfer.receive.menu.fiat.title")}
        subtitle={t("transfer.receive.menu.fiat.description")}
        Icon={Icons.Bank}
      />
      <OptionButton
        onPress={handleGoToCrypto}
        title={t("transfer.receive.menu.crypto.title")}
        subtitle={t("transfer.receive.menu.crypto.description")}
        Icon={Icons.CoinsCrypto}
      />
    </QueuedDrawerGorhom>
  );
}

function typesafeNavigation({ route, navigation }: EntryScreenProps) {
  switch (route.name) {
    case ScreenName.ReceiveSelectCrypto: {
      if (!isReceiveSelectCryptoParams(route.params)) {
        return;
      }
      navigation.navigate(ScreenName.ReceiveSelectCrypto, {
        ...route.params,
        fromMenu: true,
      });
      break;
    }

    case ScreenName.ReceiveSelectAccount: {
      if (!isReceiveSelectAccountParams(route.params)) {
        return;
      }
      navigation.navigate(ScreenName.ReceiveSelectAccount, {
        ...route.params,
        fromMenu: true,
      });
      break;
    }

    case ScreenName.ReceiveConfirmation: {
      if (!isReceiveConfirmationParams(route.params)) {
        return;
      }
      navigation.navigate(ScreenName.ReceiveConfirmation, {
        ...route.params,
        fromMenu: true,
      });
      break;
    }
  }
}

function isReceiveSelectAccountParams(
  params: unknown,
): params is ReceiveFundsStackParamList[ScreenName.ReceiveSelectAccount] {
  return isObject(params) && isCryptoOrTokenCurrency(params["currency"]);
}

function isReceiveSelectCryptoParams(
  params: unknown,
): params is ReceiveFundsStackParamList[ScreenName.ReceiveSelectCrypto] {
  if (params === undefined) return true;
  if (!isObject(params)) return false;
  if (params["filterCurrencyIds"] !== undefined && !Array.isArray(params["filterCurrencyIds"]))
    return false;
  if (params["currency"] !== undefined && typeof params["currency"] !== "string") return false;
  return true;
}

function isReceiveConfirmationParams(
  params: unknown,
): params is ReceiveFundsStackParamList[ScreenName.ReceiveConfirmation] {
  return isObject(params) && typeof params["accountId"] === "string";
}
