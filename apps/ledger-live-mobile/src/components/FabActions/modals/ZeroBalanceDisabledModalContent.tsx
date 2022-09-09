import React, { useCallback } from "react";
import { BottomDrawer, Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { useNavigation } from "@react-navigation/native";
import { ModalOnDisabledClickComponentProps } from "../index";
import ParentCurrencyIcon from "../../ParentCurrencyIcon";
import { NavigatorName, ScreenName } from "../../../const";
import Button from "../../wrappedUi/Button";

function ZeroBalanceDisabledModalContent({
  account,
  parentAccount,
  currency,
  action,
  onClose,
  isOpen,
}: ModalOnDisabledClickComponentProps) {
  const { t } = useTranslation();
  const navigation = useNavigation();

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
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: account
        ? ScreenName.ReceiveConfirmation
        : ScreenName.ReceiveSelectAccount,
      params: {
        selectedCurrency: actionCurrency,
        currency: actionCurrency,
        accountId: account?.id,
        parentId:
          parentAccount?.id ||
          (account?.type === "TokenAccount" && account?.parentId),
      },
    });
    onClose();
  }, [account, actionCurrency, navigation, onClose]);

  return (
    <BottomDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("account.modals.zeroBalanceDisabledAction.title", {
        currencyTicker: actionCurrency?.ticker,
      })}
      description={t("account.modals.zeroBalanceDisabledAction.description", {
        currencyTicker: actionCurrency?.ticker,
        actionName: action.label,
      })}
      Icon={<ParentCurrencyIcon size={48} currency={actionCurrency} />}
    >
      <Flex mx={16} flexDirection={"row"}>
        <Button
          onPress={goToBuy}
          type="main"
          size={"large"}
          outline
          flex={1}
          mr={3}
        >
          {t("account.buy")}
        </Button>
        <Button
          onPress={goToReceive}
          type="main"
          size={"large"}
          outline
          flex={1}
        >
          {t("account.receive")}
        </Button>
      </Flex>
    </BottomDrawer>
  );
}

export default ZeroBalanceDisabledModalContent;
