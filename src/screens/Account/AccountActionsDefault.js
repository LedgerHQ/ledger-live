/* @flow */
import React from "react";
import { Trans } from "react-i18next";
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
}: {
  onPress: () => void,
  style?: *,
}) => (
  <Button
    event="AccountReceive"
    type="primary"
    IconLeft={Exchange}
    onPress={onPress}
    title={<Trans i18nKey="account.buy" />}
    containerStyle={style}
  />
);
