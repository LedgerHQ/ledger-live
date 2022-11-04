import React, { useContext, useEffect } from "react";
import { useTranslation, Trans } from "react-i18next";
import { View, StyleSheet, Image } from "react-native";
import { useFocusEffect, useTheme } from "@react-navigation/native";
import _ from "lodash";
import { useSelector } from "react-redux";
import { accountScreenSelector } from "../../reducers/accounts";
import LText from "../../components/LText";
import Button from "../../components/Button";
import {
  context,
  STATUS,
  setCurrentCallRequestError,
  disconnect,
  connect,
  approveSession,
} from "./Provider";
import Spinning from "../../components/Spinning";
import BigSpinner from "../../icons/BigSpinner";
import Disconnect from "../../icons/Disconnect";
import Check from "../../icons/Check";
import Exclamation from "../../icons/Exclamation";
import CrossRound from "../../icons/CrossRound";
import CurrencyIcon from "../../components/CurrencyIcon";
import Circle from "../../components/Circle";
import Alert from "../../components/Alert";
import HeaderRightClose from "../../components/HeaderRightClose";
import { TrackScreen } from "../../analytics";
import AccountHeaderTitle from "../Account/AccountHeaderTitle";
import { rgba, Theme } from "../../colors";
import { StackNavigatorProps } from "../../components/RootNavigator/types/helpers";
import { WalletConnectNavigatorParamList } from "../../components/RootNavigator/types/WalletConnectNavigator";
import { ScreenName } from "../../const";

const DottedLine = ({ colors }: { colors: Theme["colors"] }) => (
  <View style={styles.dottedLineContainer}>
    {_.map(_.range(0, 6), i => (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: rgba(colors.darkBlue, 0.2),
          },
        ]}
        key={i}
      />
    ))}
  </View>
);

type Props = StackNavigatorProps<
  WalletConnectNavigatorParamList,
  ScreenName.WalletConnectConnect
>;

export default function Connect({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { account } = useSelector(accountScreenSelector(route));
  const wcContext = useContext(context);
  useFocusEffect(() => {
    if (wcContext.currentCallRequestId) {
      setCurrentCallRequestError(new Error("Aborted"));
    }
  });
  useEffect(() => {
    const opts = {
      headerRight: () => (
        <HeaderRightClose
          onClose={() => {
            disconnect();
          }}
          preferDismiss={false}
          skipNavigation
        />
      ),
    };

    if (wcContext.status === STATUS.CONNECTED) {
      navigation.setOptions({
        ...opts,
        title: undefined,
        headerTitle: () => <AccountHeaderTitle />,
      });
    } else {
      navigation.setOptions({
        ...opts,
        title: "Wallet Connect",
        headerTitle: "",
      });
    }
  }, [wcContext, navigation]);

  const correctIcons = _.filter((wcContext.dappInfo || {}).icons, icon =>
    ["png", "jpg", "jpeg", "bmp", "gif"].includes(icon.split(".")[-1]),
  );

  return (
    <>
      <TrackScreen category="WalletConnect" screen="Connect" />
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {!account ||
        account.type !== "Account" ||
        wcContext.status === STATUS.ERROR ? (
          <View style={styles.centerContainer}>
            <CrossRound size={50} color={colors.alert} />
            <LText style={styles.error}>
              {wcContext.error?.message || "Invalid account id"}
            </LText>
          </View>
        ) : wcContext.status === STATUS.CONNECTING && wcContext.dappInfo ? (
          <>
            <View style={styles.centerContainer}>
              <View style={styles.headerContainer}>
                <Image
                  source={
                    correctIcons.length
                      ? correctIcons[0]
                      : require("../../images/walletconnect.png")
                  }
                  style={styles.logo}
                />
                <DottedLine colors={colors} />
                <Image
                  source={require("../../images/logo_small.png")}
                  style={styles.logo}
                />
              </View>
              <LText semiBold style={styles.peerName}>
                {wcContext.dappInfo.name}
              </LText>
              <LText style={styles.details}>{wcContext.dappInfo.url}</LText>
            </View>
            <LText style={[styles.details, styles.infos]}>
              {t("walletconnect.disclaimer")}
            </LText>
            <View
              style={[
                styles.accountContainer,
                {
                  borderColor: rgba(colors.darkBlue, 0.1),
                },
              ]}
            >
              <View style={styles.accountTitleContainer}>
                <CurrencyIcon size={24} currency={account.currency} />
                <LText semiBold style={styles.accountName}>
                  {account.name}
                </LText>
              </View>
              <LText style={styles.details}>{account.freshAddress}</LText>
            </View>
          </>
        ) : wcContext.status === STATUS.CONNECTED ? (
          <>
            <View style={styles.centerContainer}>
              <View style={styles.logoContainer}>
                <Image
                  source={
                    correctIcons.length
                      ? correctIcons[0]
                      : require("../../images/walletconnect.png")
                  }
                  style={styles.logo}
                />
                <View style={styles.checkContainer}>
                  <Circle
                    bg={wcContext.socketReady ? colors.green : colors.orange}
                    size={24}
                  >
                    {wcContext.socketReady ? (
                      <Check color="white" size={12} />
                    ) : (
                      <Exclamation color="white" size={20} />
                    )}
                  </Circle>
                </View>
              </View>
              <LText semiBold style={styles.peerName}>
                {wcContext.dappInfo?.name}
              </LText>
              <LText style={styles.details}>
                {wcContext.socketReady
                  ? t("walletconnect.connected")
                  : t("walletconnect.disconnected")}
              </LText>
            </View>
            {wcContext.socketReady ? (
              <View style={styles.messagesContainer}>
                <Alert type="primary">
                  <Trans
                    i18nKey="walletconnect.info"
                    values={{
                      name: wcContext.dappInfo?.name,
                    }}
                  />
                </Alert>
                <View style={styles.messagesSeparator} />
                <Alert type="warning">{t("walletconnect.warning")}</Alert>
              </View>
            ) : (
              <View style={styles.messagesContainer}>
                <Alert type="warning">
                  {t("walletconnect.warningdisconnected")}
                </Alert>
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.centerContainer}>
              <Spinning clockwise>
                <BigSpinner />
              </Spinning>
              {wcContext.dappInfo ? (
                <>
                  <LText semiBold style={styles.peerName}>
                    {wcContext.dappInfo.name}
                  </LText>
                  <LText style={styles.details}>
                    {t("walletconnect.isconnecting")}
                  </LText>
                </>
              ) : null}
            </View>
          </>
        )}
      </View>
      {wcContext.status === STATUS.CONNECTING &&
      account &&
      wcContext.dappInfo ? (
        <View style={styles.buttonsContainer}>
          <Button
            containerStyle={styles.buttonContainer}
            type="secondary"
            event="wc connecting reject"
            title={t("walletconnect.reject")}
            onPress={() => {
              disconnect();
            }}
          />
          <Button
            event="wc connecting connect"
            containerStyle={styles.buttonContainer}
            type="primary"
            title={t("walletconnect.connect")}
            onPress={() => {
              approveSession(account);
            }}
          />
        </View>
      ) : wcContext.status === STATUS.CONNECTED ? (
        <View
          style={[
            styles.buttonsContainer,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Button
            containerStyle={styles.buttonContainer}
            event="wc connected disconnect"
            type="primary"
            title={t("walletconnect.disconnect")}
            onPress={() => {
              disconnect();
            }}
            IconLeft={Disconnect}
          />
        </View>
      ) : wcContext.status === STATUS.ERROR ? (
        <View style={styles.verticalButtonsContainer}>
          <Button
            containerStyle={styles.verticalButton}
            event="wc error retry"
            type="primary"
            title={t("walletconnect.retry")}
            onPress={() => {
              connect(route.params.uri);
            }}
          />
          <Button
            containerStyle={styles.verticalButton}
            event="wc error close"
            type="greySecondary"
            title={t("walletconnect.close")}
            onPress={() => {
              disconnect();
            }}
          />
        </View>
      ) : null}
    </>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    justifyContent: "center",
    flex: 1,
  },
  centerContainer: {
    alignItems: "center",
  },
  verticalButtonsContainer: {
    marginHorizontal: 16,
  },
  verticalButton: {
    marginVertical: 8,
  },
  messagesContainer: {
    marginHorizontal: 16,
    marginTop: 32,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 214,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  dottedLineContainer: {
    width: 54,
    height: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accountContainer: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 4,
    marginHorizontal: 16,
  },
  logoContainer: {
    position: "relative",
  },
  checkContainer: {
    position: "absolute",
    top: -5,
    right: -6,
  },
  accountTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 19,
    justifyContent: "center",
  },
  dot: {
    height: 3,
    width: 3,
    borderRadius: 3,
  },
  buttonContainer: {
    flex: 1,
    margin: 8,
  },
  logo: {
    width: 64,
    height: 64,
  },
  error: {
    textAlign: "center",
    marginTop: 60,
  },
  peerName: {
    fontSize: 18,
    lineHeight: 22,
  },
  details: {
    opacity: 0.5,
    textAlign: "center",
  },
  infos: {
    marginVertical: 24,
    marginHorizontal: 16,
  },
  accountName: {
    marginLeft: 11,
    fontSize: 16,
  },
  messagesSeparator: {
    height: 16,
  },
});
