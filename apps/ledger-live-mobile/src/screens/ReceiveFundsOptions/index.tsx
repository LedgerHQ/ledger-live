import React from "react";
import { Text, Box } from "@ledgerhq/native-ui";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet } from "react-native";
import { ModalHeaderCloseButton } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
import { Icons } from "@ledgerhq/native-ui/index";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import { OptionButton } from "./OptionButton";
import { ReceiveFundsStackParamList } from "~/components/RootNavigator/types/ReceiveFundsNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { isCryptoOrTokenCurrency } from "~/newArch/utils/isCryptoOrTokenCurrency";
import { isObject } from "~/newArch/utils/isObject";

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

  function handleGoToFiat() {
    navigation.replace(ScreenName.ReceiveProvider, { manifestId: "noah", fromMenu: true });
  }

  function handleGoToCrypto() {
    typesafeNavigation(props);
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <TrackScreen category="Deposit" name="Options" />
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0, 0, 0, 0.5)" }]}
        onPress={navigation.goBack}
      />
      <Box
        bg={"background.drawer"}
        width={"100%"}
        borderTopLeftRadius={24}
        borderTopRightRadius={24}
        py={6}
        px={6}
      >
        <ModalHeaderCloseButton onClose={navigation.goBack} />
        <Text textAlign="center" fontSize={24} mb={5}>
          {t("transfer.receive.title")}
        </Text>
        <OptionButton
          onPress={handleGoToCrypto}
          title={t("transfer.receive.menu.crypto.title")}
          subtitle={t("transfer.receive.menu.crypto.description")}
          Icon={Icons.CoinsCrypto}
        />
        <OptionButton
          onPress={handleGoToFiat}
          title={t("transfer.receive.menu.fiat.title")}
          subtitle={t("transfer.receive.menu.fiat.description")}
          Icon={Icons.Bank}
        />
      </Box>
    </SafeAreaView>
  );
}

function typesafeNavigation({ route, navigation }: EntryScreenProps) {
  switch (route.name) {
    case ScreenName.ReceiveSelectCrypto: {
      if (!isReceiveSelectCryptoParams(route.params)) {
        return;
      }
      navigation.navigate(ScreenName.ReceiveSelectCrypto, {
        ...(route.params ?? {}),
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
