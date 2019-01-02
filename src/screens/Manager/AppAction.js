/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-navigation";
import ProgressCircle from "react-native-progress/Circle";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import type { ApplicationVersion } from "@ledgerhq/live-common/lib/types/manager";
import install from "@ledgerhq/live-common/lib/hw/installApp";
import uninstall from "@ledgerhq/live-common/lib/hw/uninstallApp";
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

class PendingProgress extends PureComponent<{
  progress: number,
}> {
  render() {
    const { progress } = this.props;
    // TODO figure out a smooth transition
    return (
      <View style={progressStyles.centered}>
        <ProgressCircle
          progress={progress}
          color={colors.live}
          unfilledColor={colors.fog}
          borderWidth={0}
          thickness={3.6}
          size={22}
          strokeCap="round"
        />
      </View>
    );
  }
}

const progressStyles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    color: colors.white,
    fontSize: 16,
  },
});

const hwCallPerType = {
  install,
  uninstall,
};

const forceInset = { bottom: "always" };

class AppAction extends PureComponent<
  {
    action: {
      app: ApplicationVersion,
      type: "install" | "uninstall",
    },
    targetId: *,
    deviceId: string,
    onClose: () => void,
    onOpenAccounts: () => void,
    isOpened: boolean,
  },
  {
    pending: boolean,
    error: ?Error,
    progress: number,
  },
> {
  state = {
    pending: true,
    error: null,
    progress: 0,
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
      next: patch => {
        this.setState(patch);
      },
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
    const { action, onOpenAccounts, onClose, isOpened } = this.props;
    const { pending, error, progress } = this.state;
    const path = `${action.type}.${pending ? "loading" : "done"}`;
    const progressPercentage = Math.round(progress * 100);
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
    ) : (
      <Trans
        i18nKey={`AppAction.${path}.desc`}
        values={{ appName: action.app.name }}
      />
    );

    const buttonTitle = pending ? (
      <Trans
        i18nKey={`AppAction.${path}.button`}
        values={{ progressPercentage }}
        count={progressPercentage + 1}
      />
    ) : (
      <Trans i18nKey="common.close" />
    );

    return (
      <BottomModal
        id={action.type + "AppActionModal"}
        isOpened={isOpened}
        onClose={onClose}
      >
        <SafeAreaView forceInset={forceInset} style={styles.root}>
          <View style={styles.body}>
            <View style={styles.headIcon}>
              {icon}
              <View style={styles.loaderWrapper}>
                {pending ? (
                  progress ? (
                    <PendingProgress progress={progress} />
                  ) : (
                    <Spinning clockwise>
                      <Image
                        source={spinner}
                        style={{ width: 22, height: 22 }}
                      />
                    </Spinning>
                  )
                ) : !error ? (
                  <View style={styles.iconWrapper}>
                    <Check size={14} color={colors.white} />
                  </View>
                ) : null}
              </View>
            </View>
            <LText secondary semiBold style={styles.title}>
              {title}
            </LText>
            {description ? (
              <LText style={styles.description}>{description}</LText>
            ) : null}
          </View>
          <View style={styles.buttonsContainer}>
            <Button
              event="ManagerAppActionDone"
              type={error ? "primary" : "secondary"}
              containerStyle={styles.button}
              onPress={onClose}
              disabled={pending}
              title={buttonTitle}
            />
            {!error &&
              !pending && (
                <Button
                  event="ManagerAppActionDoneGoToAccounts"
                  type="primary"
                  containerStyle={[styles.button, styles.buttonRight]}
                  onPress={onOpenAccounts}
                  disabled={pending}
                  title={<Trans i18nKey="AppAction.install.done.accounts" />}
                />
              )}
          </View>
        </SafeAreaView>
        <Touchable
          event="ManagerAppActionClose"
          style={styles.close}
          onPress={onClose}
        >
          <Close color={colors.fog} size={20} />
        </Touchable>
      </BottomModal>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "column",
    paddingHorizontal: 20,
  },
  body: {
    flexDirection: "column",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 20,
  },
  close: {
    position: "absolute",
    right: 16,
    top: 16,
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
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  buttonRight: {
    marginLeft: 8,
    flex: 2,
  },
  buttonsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    flexGrow: 1,
  },
  loaderWrapper: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "white",
    padding: 4,
    borderRadius: 50,
  },
  iconWrapper: {
    borderRadius: 24,
    backgroundColor: colors.green,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AppAction;
