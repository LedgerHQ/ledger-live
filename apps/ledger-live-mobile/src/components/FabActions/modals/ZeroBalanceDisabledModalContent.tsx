import React, { useCallback } from "react";
import { Flex } from "@ledgerhq/native-ui";
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

  const actionCurrency = account ? getAccountCurrency(account) : currency;

  const goToBuy = useCallback(() => {
    navigation.navigate(NavigatorName.Exchange, {
      screen: ScreenName.ExchangeBuy,
      params: {
        defaultCurrencyId: actionCurrency?.id,
        defaultAccountId: account?.id,
      },
    });
    onClose();
  }, [account?.id, actionCurrency?.id, navigation, onClose]);

  const goToReceive = useCallback(() => {
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
  }, [account, parentAccount?.id, actionCurrency, navigation, onClose]);

  return (
    <QueuedDrawer
      isRequestingToBeOpened={!!isOpen}
      onClose={onClose}
      title={t("account.modals.zeroBalanceDisabledAction.title", {
        currencyTicker: actionCurrency?.ticker,
      })}
      description={t("account.modals.zeroBalanceDisabledAction.description", {
        currencyTicker: actionCurrency?.ticker,
        actionName: action.label,
      })}
      Icon={<ParentCurrencyIcon size={48} currency={actionCurrency as Currency} />}
    >
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
