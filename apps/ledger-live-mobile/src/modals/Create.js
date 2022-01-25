/* @flow */

import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

import { NavigatorName, ScreenName } from "../const";
import {
  accountsCountSelector,
  hasLendEnabledAccountsSelector,
} from "../reducers/accounts";
import IconSend from "../icons/Send";
import IconReceive from "../icons/Receive";
import IconExchange from "../icons/Exchange";
import IconSwap from "../icons/Swap";
import IconLending from "../icons/Lending";
import BottomModal from "../components/BottomModal";
import BottomModalChoice from "../components/BottomModalChoice";
import type { Props as ModalProps } from "../components/BottomModal";
import { readOnlyModeEnabledSelector } from "../reducers/settings";

export default function CreateModal({ isOpened, onClose }: ModalProps) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const accountsCount = useSelector(accountsCountSelector);
  const lendingEnabled = useSelector(hasLendEnabledAccountsSelector);

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
    () =>
      onNavigate(NavigatorName.ReceiveFunds, {
        screen: ScreenName.ReceiveSelectAccount,
      }),
    [onNavigate],
  );
  const onSwap = useCallback(
    () =>
      onNavigate(NavigatorName.Swap, {
        screen: ScreenName.Swap,
      }),
    [onNavigate],
  );
  const onExchange = useCallback(() => onNavigate(ScreenName.Exchange), [
    onNavigate,
  ]);
  const onLending = useCallback(
    () =>
      onNavigate(NavigatorName.Lending, {
        screen: ScreenName.LendingDashboard,
      }),
    [onNavigate],
  );

  return (
    <BottomModal id="CreateModal" isOpened={isOpened} onClose={onClose}>
      <BottomModalChoice
        event="TransferSend"
        title={t("transfer.send.title")}
        onPress={accountsCount > 0 && !readOnlyModeEnabled ? onSendFunds : null}
        Icon={IconSend}
      />
      <BottomModalChoice
        event="TransferReceive"
        title={t("transfer.receive.title")}
        onPress={accountsCount > 0 ? onReceiveFunds : null}
        Icon={IconReceive}
      />
      <BottomModalChoice
        event="TransferExchange"
        title={t("transfer.exchange.title")}
        Icon={IconExchange}
        onPress={onExchange}
      />
      <BottomModalChoice
        event="TransferSwap"
        title={t("transfer.swap.title")}
        Icon={IconSwap}
        onPress={accountsCount > 0 && !readOnlyModeEnabled ? onSwap : null}
      />
      {lendingEnabled ? (
        <BottomModalChoice
          event="TransferLending"
          title={t("transfer.lending.titleTransferTab")}
          Icon={IconLending}
          onPress={accountsCount > 0 && !readOnlyModeEnabled ? onLending : null}
        />
      ) : null}
    </BottomModal>
  );
}
