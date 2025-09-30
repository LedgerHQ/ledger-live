import React, { useCallback } from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useNavigation } from "@react-navigation/native";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { ModalOnDisabledClickComponentProps } from "../index";
import ParentCurrencyIcon from "../../ParentCurrencyIcon";
import { NavigatorName, ScreenName } from "~/const";
import Button from "../../wrappedUi/Button";
import {
  RootNavigationComposite,
  StackNavigatorNavigation,
} from "../../RootNavigator/types/helpers";
import { BaseNavigatorStackParamList } from "../../RootNavigator/types/BaseNavigator";
import QueuedDrawer from "../../QueuedDrawer";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";
import { useSelector } from "react-redux";
import { readOnlyModeEnabledSelector, hasOrderedNanoSelector } from "~/reducers/settings";

function ZeroBalanceDisabledModalContent({
  account,
  parentAccount,
  currency,
  action,
  onClose,
  isOpen,
}: ModalOnDisabledClickComponentProps) {
  const { t } = useTranslation();
  const navigation =
    useNavigation<RootNavigationComposite<StackNavigatorNavigation<BaseNavigatorStackParamList>>>();
  const { navigateToRebornFlow } = useRebornFlow();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);

  const actionCurrency = account ? getAccountCurrency(account) : currency;

  const goToBuy = useCallback(() => {
    if (readOnlyModeEnabled && !hasOrderedNano) {
      navigateToRebornFlow();
      return;
    }
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultCurrencyId: actionCurrency?.id,
        defaultAccountId: account?.id,
      },
    });
    onClose();
  }, [
    account?.id,
    actionCurrency?.id,
    hasOrderedNano,
    navigateToRebornFlow,
    navigation,
    onClose,
    readOnlyModeEnabled,
  ]);

  const goToReceive = useCallback(() => {
    if (readOnlyModeEnabled && !hasOrderedNano) {
      navigateToRebornFlow();
      return;
    }
    if (account) {
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveConfirmation,
        params: {
          currency: actionCurrency,
          accountId: account?.id || "",
          parentId:
            parentAccount?.id || (account?.type === "TokenAccount" ? account?.parentId : undefined),
        },
      });
    } else {
      navigation.navigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectAccount,
        params: {
          currency: actionCurrency!,
        },
      });
    }
    onClose();
  }, [
    readOnlyModeEnabled,
    hasOrderedNano,
    account,
    onClose,
    navigateToRebornFlow,
    navigation,
    actionCurrency,
    parentAccount?.id,
  ]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpen}
      onClose={onClose}
      title={t("account.modals.zeroBalanceDisabledAction.title", {
        currencyTicker: actionCurrency?.ticker,
      })}
    >
      <Flex alignItems="center" mb={6}>
        <ParentCurrencyIcon size={48} currency={actionCurrency as Currency} />
        <Text mt={4} textAlign="center" variant="bodyLineHeight" color="neutral.c70">
          {t("account.modals.zeroBalanceDisabledAction.description", {
            currencyTicker: actionCurrency?.ticker,
            actionName: action.label,
          })}
        </Text>
      </Flex>
      <Flex mx={16} flexDirection={"row"}>
        <Button onPress={goToBuy} type="main" size={"large"} outline flex={1} mr={3}>
          {t("account.buy")}
        </Button>
        <Button onPress={goToReceive} type="main" size={"large"} outline flex={1}>
          {t("account.receive")}
        </Button>
      </Flex>
    </QueuedDrawer>
  );
}

export default ZeroBalanceDisabledModalContent;
