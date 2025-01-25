import { getMessageProperties } from "@ledgerhq/coin-evm/logic";
import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AccountLike, AnyMessage, MessageProperties } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import Animation from "./Animation";
import LText from "./LText";
import { useAccountName } from "~/reducers/wallet";

type Props = {
  device: Device;
  message: AnyMessage;
  account: AccountLike;
};

export default function ValidateOnDevice({ device, message: messageData, account }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const messageContainerStyle = useMemo(
    () => [
      styles.messageContainer,
      {
        backgroundColor: colors.background,
      },
    ],
    [colors.background],
  );
  const messageTextStyle = useMemo(
    () => [
      styles.property,
      {
        color: colors.text,
      },
    ],
    [colors.text],
  );
  const mainAccount = getMainAccount(account, null);

  const mainAccountName = useAccountName(mainAccount);

  const [messageFields, setMessageFields] = useState<MessageProperties | null>(null);

  const isACREWithdraw = "type" in messageData && messageData.type === "Withdraw";

  useEffect(() => {
    if (messageData.standard === "EIP712") {
      getMessageProperties(messageData).then(setMessageFields);
    }
  }, [mainAccount, mainAccount.currency, messageData, setMessageFields]);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContainerContent}
      >
        <View style={styles.innerContainer}>
          <View style={styles.picture}>
            <Animation
              source={getDeviceAnimation({
                modelId: device.modelId,
                key: "sign",
              })}
            />
          </View>
        </View>
        <LText style={styles.action}>{t("walletconnect.stepVerification.action")}</LText>
        <View style={messageContainerStyle}>
          <LText style={messageTextStyle}>{t("walletconnect.stepVerification.accountName")}</LText>
          <LText semiBold>{mainAccountName}</LText>
        </View>
        {!isACREWithdraw ? (
          messageData.standard === "EIP712" ? (
            <>
              {messageFields
                ? messageFields.map(({ label, value }) => (
                    <View key={label} style={messageContainerStyle}>
                      <LText style={messageTextStyle}>{label}</LText>
                      {Array.isArray(value) ? (
                        value.map((v, i) => (
                          <LText key={i} style={[styles.value, styles.subValue]} semiBold>
                            {v}
                          </LText>
                        ))
                      ) : (
                        <LText style={styles.value} semiBold>
                          {value}
                        </LText>
                      )}
                    </View>
                  ))
                : null}
            </>
          ) : (
            <View style={messageContainerStyle}>
              <LText style={messageTextStyle}>{t("walletconnect.message")}</LText>
              <LText semiBold>{messageData.message}</LText>
            </View>
          )
        ) : null}
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
  scrollContainerContent: {
    paddingBottom: 32,
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
  value: {
    paddingLeft: 4,
  },
  subValue: {
    marginBottom: 6,
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
