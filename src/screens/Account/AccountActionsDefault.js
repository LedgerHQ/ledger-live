/* @flow */
import React from "react";
import { Trans } from "react-i18next";
import { getAccountCurrency } from "@ledgerhq/live-common/lib/account/helpers";
import type { Account } from "@ledgerhq/live-common/lib/types/account";
import Button from "../../components/Button";
import IconSend from "../../icons/Send";
import IconReceive from "../../icons/Receive";
import Exchange from "../../icons/Exchange";

export const SendActionDefault = ({
  onPress,
  style,
}: {
  onPress: () => void,
  style?: *,
}) => (
  <Button
    event="AccountSend"
    type="primary"
    IconLeft={IconSend}
    onPress={onPress}
    title={<Trans i18nKey="account.send" />}
    containerStyle={style}
  />
);

export const ReceiveActionDefault = ({
  onPress,
  style,
}: {
  onPress: () => void,
  style?: *,
}) => (
  <Button
    event="AccountReceive"
    type="primary"
    IconLeft={IconReceive}
    onPress={onPress}
    title={<Trans i18nKey="account.receive" />}
    containerStyle={style}
  />
);

export const BuyActionDefault = ({
  onPress,
  style,
  account,
}: {
  onPress: () => void,
  style?: *,
  account: Account,
}) => (
  <Button
    event="Buy Crypto Account Button"
    eventProperties={{
      currencyName: getAccountCurrency(account).name,
    }}
    type="primary"
    IconLeft={Exchange}
    onPress={onPress}
    title={<Trans i18nKey="account.buy" />}
    containerStyle={style}
  />
);
