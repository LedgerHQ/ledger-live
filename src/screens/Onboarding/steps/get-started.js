// @flow
import React, { Component, PureComponent } from "react";
import { StyleSheet, View, Linking, Platform } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import FontAwesome from "react-native-vector-icons/dist/FontAwesome";
import { getDeviceModel } from "@ledgerhq/devices";
import { createStructuredSelector } from "reselect";
import { hasCompletedOnboardingSelector } from "../../../reducers/settings";

import type { OnboardingStepProps } from "../types";
import { TrackScreen } from "../../../analytics";
import OnboardingLayout from "../OnboardingLayout";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import { withOnboardingContext } from "../onboardingContext";
import IconImport from "../../../icons/Import";
import IconCheck from "../../../icons/Check";
import IconRestore from "../../../icons/History";
import colors from "../../../colors";
import { urls } from "../../../config/urls";
import UpgradeToNanoXBanner from "../../../components/UpgradeToNanoXBanner";
import StepLegacyModal from "../../../modals/StepLegacyModal";

const IconPlus = () => <Icon name="plus" color={colors.live} size={16} />;

type Props = OnboardingStepProps & {
  hasCompletedOnboarding: boolean,
};

const mapStateToProps = createStructuredSelector({
  hasCompletedOnboarding: hasCompletedOnboardingSelector,
});

class OnboardingStepGetStarted extends Component<Props, *> {
  state = {
    modalVisible: false,
  };

  onImport = async () => {
    await this.props.setOnboardingMode("qr");
    this.props.next();
  };

  onInitialized = async () => {
    await this.props.setOnboardingMode("alreadyInitialized");
    this.props.next();
  };

  onInit = async () => {
    await this.props.setOnboardingMode("full");
    this.props.next();
  };

  onRestore = async () => {
    await this.props.setOnboardingMode("restore");
    this.props.next();
  };

  onBuy = () => Linking.openURL(urls.buyNanoX);

  Footer = () => <UpgradeToNanoXBanner action={this.onBuy} />;

  enableModal = () => {
    this.setState({ modalVisible: true });
  };

  quitModal = () => {
    this.setState({ modalVisible: false });
  };

  render() {
    const { modalVisible } = this.state;
    const { deviceModelId, hasCompletedOnboarding } = this.props;
    const deviceModel = getDeviceModel(deviceModelId);
    const title = deviceModel.productName;
    const showAd = deviceModelId !== "nanoX";

    return (
      <OnboardingLayout
        header="OnboardingStepGetStarted"
        Footer={showAd ? this.Footer : undefined}
        titleOverride={title}
      >
        <TrackScreen category="Onboarding" name="GetStarted" />
        {!hasCompletedOnboarding || deviceModelId !== "nanoX" ? (
          <Row
            id="import"
            Icon={IconImport}
            label={<Trans i18nKey="onboarding.stepGetStarted.import" />}
            onPress={this.onImport}
          />
        ) : null}
        {deviceModelId === "nanoX" || Platform.OS === "android" ? (
          <>
            <Row
              id="initialize"
              Icon={IconPlus}
              label={<Trans i18nKey="onboarding.stepGetStarted.initialize" />}
              onPress={this.onInit}
            />
            <Row
              id="restore"
              Icon={IconRestore}
              label={<Trans i18nKey="onboarding.stepGetStarted.restore" />}
              onPress={this.onRestore}
            />
            <Row
              id="initialized"
              Icon={IconCheck}
              label={<Trans i18nKey="onboarding.stepGetStarted.initialized" />}
              onPress={this.onInitialized}
            />
          </>
        ) : (
          <Touchable event="StepLegacyOpenModal" onPress={this.enableModal}>
            <LText style={styles.description}>
              <Trans i18nKey="onboarding.stepLegacy.description" />{" "}
              <FontAwesome name="info-circle" size={14} color={colors.fog} />
            </LText>
          </Touchable>
        )}
        <StepLegacyModal isOpened={modalVisible} onClose={this.quitModal} />
      </OnboardingLayout>
    );
  }
}

type RowProps = {
  Icon: React$ComponentType<*>,
  label: string | React$Element<*>,
  onPress: () => any,
  id: string,
};

class Row extends PureComponent<RowProps> {
  render() {
    const { onPress, label, Icon, id } = this.props;
    return (
      <Touchable
        event="OnboardingGetStartedChoice"
        eventProperties={{ id }}
        onPress={onPress}
        style={styles.row}
      >
        <View style={styles.rowIcon}>
          {Icon ? <Icon size={16} color={colors.live} /> : null}
        </View>
        <LText style={styles.label} semiBold>
          {label}
        </LText>
      </Touchable>
    );
  }
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    color: colors.darkBlue,
    marginVertical: 32,
  },
  subtitle: {
    marginHorizontal: 1,
    fontSize: 14,
    color: colors.smoke,
    marginBottom: 16,
  },
  extraMargin: {
    marginTop: 32,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.fog,
    borderRadius: 4,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.darkBlue,
  },
  rowIcon: {
    width: 16,
    marginRight: 16,
  },
  footer: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  footerText: {
    fontSize: 14,
    color: colors.live,
  },
  description: {
    marginTop: 40,
    padding: 16,
    fontSize: 14,
    lineHeight: 21,
    color: colors.smoke,
    textAlign: "center",
  },
});

export default connect(mapStateToProps)(
  withOnboardingContext(OnboardingStepGetStarted),
);
