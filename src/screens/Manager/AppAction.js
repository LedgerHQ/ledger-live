/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";
import type { ApplicationVersion } from "../../types/manager";
import install from "../../logic/hw/installApp";
import uninstall from "../../logic/hw/uninstallApp";
import { withDevice } from "../../logic/hw/deviceAccess";
import BottomModal from "../../components/BottomModal";
import Close from "../../icons/Close";
import Button from "../../components/Button";
import LText from "../../components/LText";
import Touchable from "../../components/Touchable";
import ErrorIcon from "../../components/ErrorIcon";
import TranslatedError from "../../components/TranslatedError";
import spinner from "../../images/spinner.png";
import Check from "../../icons/Check";
import Spinning from "../../components/Spinning";
import { deviceNames } from "../../wording";
import colors from "../../colors";
import AppIcon from "./AppIcon";

const hwCallPerType = {
  install,
  uninstall,
};

class AppAction extends PureComponent<
  {
    action: {
      app: ApplicationVersion,
      type: "install" | "uninstall",
    },
    targetId: *,
    deviceId: string,
    onClose: () => void,
  },
  {
    pending: boolean,
    error: ?Error,
  },
> {
  state = {
    pending: true,
    error: null,
  };

  sub: *;

  componentDidMount() {
    const {
      deviceId,
      targetId,
      action: { type, app },
    } = this.props;
    const hwCall = hwCallPerType[type];
    this.sub = withDevice(deviceId)(transport =>
      hwCall(transport, targetId, app),
    ).subscribe({
      complete: () => {
        this.setState({ pending: false, error: null });
      },
      error: error => {
        this.setState({ pending: false, error });
      },
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    const { action, onClose } = this.props;
    const { pending, error } = this.state;
    const path = `${action.type}.${pending ? "loading" : "done"}`;

    const icon = error ? (
      <ErrorIcon error={error} />
    ) : (
      <AppIcon size={60} icon={action.app.icon} />
    );

    const title = error ? (
      <TranslatedError error={error} />
    ) : (
      <Trans
        i18nKey={`AppAction.${path}.title`}
        values={{ ...deviceNames.nanoX, appName: action.app.name }}
      />
    );

    const description = error ? (
      <TranslatedError error={error} field="description" />
    ) : null;

    const buttonTitle = pending ? (
      <Trans i18nKey={`AppAction.${path}.button`} />
    ) : (
      <Trans i18nKey="common.close" />
    );

    return (
      <BottomModal isOpened onClose={onClose}>
        <View style={styles.root}>
          <View style={styles.body}>
            <View style={styles.headIcon}>
              {icon}
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: "white",
                  padding: 4,
                  borderRadius: 50,
                }}
              >
                {pending ? (
                  <Spinning>
                    <Image source={spinner} style={{ width: 24, height: 24 }} />
                  </Spinning>
                ) : (
                  <View
                    style={{
                      borderRadius: 24,
                      backgroundColor: colors.green,
                      width: 24,
                      height: 24,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Check size={14} color={colors.white} />
                  </View>
                )}
              </View>
            </View>
            <LText secondary semiBold style={styles.title}>
              {title}
            </LText>
            {description ? (
              <LText style={styles.description}>{description}</LText>
            ) : null}
          </View>
          <Button
            type="primary"
            onPress={onClose}
            disabled={pending}
            title={buttonTitle}
          />
        </View>
        <Touchable style={styles.close} onPress={onClose}>
          <Close color={colors.fog} size={20} />
        </Touchable>
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    minHeight: 280,
    paddingHorizontal: 20,
  },
  body: {
    flex: 1,
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
  },
  close: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  headIcon: {
    padding: 10,
    position: "relative",
  },
  title: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    lineHeight: 26,
    fontSize: 16,
    color: colors.darkBlue,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: colors.grey,
    paddingHorizontal: 40,
    textAlign: "center",
  },
  retryButton: {
    alignSelf: "stretch",
  },
});

export default AppAction;
