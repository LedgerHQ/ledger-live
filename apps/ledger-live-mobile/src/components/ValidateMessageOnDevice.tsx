import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { TypedMessageData } from "@ledgerhq/live-common/families/ethereum/types";
import type { MessageData } from "@ledgerhq/live-common/hw/signMessage/types";
import type { AccountLike } from "@ledgerhq/types-live";
import LText from "./LText";
import Animation from "./Animation";
import { getDeviceAnimation } from "../helpers/getDeviceAnimation";

type Props = {
  device: Device;
  message: TypedMessageData | MessageData;
  account: AccountLike;
};
export default function ValidateOnDevice({ device, message, account }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const messageContainerStyle = [
    styles.messageContainer,
    {
      backgroundColor: colors.background,
    },
  ];
  const messageTextStyle = [
    styles.property,
    {
      color: colors.text,
    },
  ];
  return (
    <View style={styles.root}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.innerContainer}>
          <View style={styles.picture}>
            <Animation
              source={getDeviceAnimation({
                device,
                key: "validate",
              })}
            />
          </View>
        </View>
        <LText style={styles.action}>
          {t("walletconnect.stepVerification.action")}
        </LText>
        <View style={messageContainerStyle}>
          <LText style={messageTextStyle}>
            {t("walletconnect.stepVerification.accountName")}
          </LText>
          <LText semiBold>{account && account.name ? account.name : ""}</LText>
        </View>
        {message && message.hashes && message.hashes.domainHash ? (
          <View style={messageContainerStyle}>
            <LText style={messageTextStyle}>
              {t("walletconnect.domainHash")}
            </LText>
            <LText semiBold>
              {message && message.hashes && message.hashes.domainHash
                ? message.hashes.domainHash
                : ""}
            </LText>
          </View>
        ) : null}
        {message && message.hashes && message.hashes.messageHash ? (
          <View style={messageContainerStyle}>
            <LText style={messageTextStyle}>
              {t("walletconnect.messageHash")}
            </LText>
            <LText semiBold>
              {message && message.hashes && message.hashes.messageHash
                ? message.hashes.messageHash
                : ""}
            </LText>
          </View>
        ) : null}
        {message && message.hashes && message.hashes.stringHash ? (
          <View style={messageContainerStyle}>
            <LText style={messageTextStyle}>
              {t("walletconnect.stringHash")}
            </LText>
            <LText semiBold>
              {message && message.hashes && message.hashes.stringHash
                ? message.hashes.stringHash
                : ""}
            </LText>
          </View>
        ) : null}
        <View style={messageContainerStyle}>
          <LText style={messageTextStyle}>{t("walletconnect.message")}</LText>
          <LText semiBold>
            {message.message.domain
              ? JSON.stringify(message.message)
              : message.message}
          </LText>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  innerContainer: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 4,
    marginTop: 2,
  },
  property: {
    opacity: 0.5,
    marginBottom: 8,
  },
  picture: {
    marginBottom: 40,
  },
  action: {
    fontSize: 18,
    lineHeight: 27,
    textAlign: "center",
    marginBottom: 36,
  },
});
