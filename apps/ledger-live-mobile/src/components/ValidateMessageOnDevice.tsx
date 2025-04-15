import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { AccountLike, AnyMessage } from "@ledgerhq/types-live";
import { useTheme } from "@react-navigation/native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { getDeviceAnimation } from "~/helpers/getDeviceAnimation";
import Animation from "./Animation";
import LText from "./LText";
import { useAccountName } from "~/reducers/wallet";
import { Flex, Text } from "@ledgerhq/native-ui";
import { getDeviceModel } from "@ledgerhq/devices";
import { DeviceModelId } from "@ledgerhq/types-devices";

type Props = {
  device: Device;
  message: AnyMessage;
  account: AccountLike;
};

const getProductName = (modelId: DeviceModelId) =>
  getDeviceModel(modelId)?.productName.replace("Ledger", "").trimStart() || modelId;

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

  const isACREWithdraw = "type" in messageData && messageData.type === "Withdraw";

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

        {messageData.standard === "EIP712" ? (
          <Flex justifyContent="center" alignItems="center" flexDirection="column" rowGap={16}>
            <Text fontWeight="semiBold" color="neutral.c100" textAlign="center" fontSize="20px">
              {t("walletconnect.stepVerification.title", {
                wording: getProductName(device.modelId),
              })}
            </Text>
            <Text variant="bodyLineHeight" color="neutral.c70" textAlign="center" fontSize="14px">
              {t("walletconnect.stepVerification.description")}
            </Text>
          </Flex>
        ) : (
          <>
            <LText style={styles.action}>{t("walletconnect.stepVerification.action")}</LText>
            <View style={messageContainerStyle}>
              <LText style={messageTextStyle}>
                {t("walletconnect.stepVerification.accountName")}
              </LText>
              <LText semiBold>{mainAccountName}</LText>
            </View>{" "}
          </>
        )}

        {!isACREWithdraw ? (
          messageData.standard === "EIP712" ? null : (
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
