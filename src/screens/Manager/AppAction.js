/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet, Image } from "react-native";
import { Trans } from "react-i18next";
import { SafeAreaView } from "react-navigation";
import ProgressCircle from "react-native-progress/Circle";
import { throttleTime, filter, map } from "rxjs/operators";
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

class PendingProgress extends PureComponent<{
  progress: number,
}> {
  render() {
    const { progress } = this.props;
    // TODO figure out a smooth transition
    return (
      <View style={progressStyles.centered}>
        <ProgressCircle
          progress={0.15 + 0.85 * progress}
          color={colors.live}
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
    )
      .pipe(
        filter(e => e.type === "bulk-progress"), // only bulk progress interests the UI
        throttleTime(100), // throttle to only emit 10 event/s max, to not spam the UI
        map(e => e.progress), // extract a stream of progress percentage
      )
      .subscribe({
        next: progress => {
          this.setState({ progress });
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
    const { action, onClose, isOpened } = this.props;
    const { pending, error, progress } = this.state;
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
                        style={{ width: 24, height: 24 }}
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
          <Button
            event="ManagerAppActionDone"
            type="primary"
            onPress={onClose}
            disabled={pending}
            title={buttonTitle}
          />
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
  retryButton: {
    alignSelf: "stretch",
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
