// @flow

import React, { Component, PureComponent } from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";

import { TrackScreen } from "../../../analytics";
import OnboardingLayout from "../OnboardingLayout";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import { withOnboardingContext } from "../onboardingContext";
import IconImport from "../../../icons/Import";
import colors from "../../../colors";
import type { OnboardingStepProps } from "../types";
import { urls } from "../../../config/urls";
import { deviceNames } from "../../../wording";
import UpgradeToNanoXBanner from "../../../components/UpgradeToNanoXBanner";

class OnboardingStepLegacy extends Component<OnboardingStepProps> {
  onImport = async () => {
    this.props.next();
  };

  onBuy = () => Linking.openURL(urls.buyNanoX);

  Footer = () => <UpgradeToNanoXBanner action={this.onBuy} />;

  render() {
    const { deviceModel } = this.props;
    const title =
      deviceModel === "blue"
        ? deviceNames.blue.fullDeviceName
        : deviceNames.nanoS.fullDeviceName;

    return (
      <OnboardingLayout
        header="OnboardingStepLegacy"
        Footer={this.Footer}
        titleOverride={title}
      >
        <TrackScreen category="Onboarding" name="GetStarted" />
        <Row
          id="import"
          Icon={IconImport}
          label={<Trans i18nKey="onboarding.stepGetStarted.import" />}
          onPress={this.onImport}
        />
        <LText style={styles.description}>
          <Trans i18nKey="onboarding.stepLegacy.description" />
        </LText>
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
          {Icon && <Icon size={16} color={colors.live} />}
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
  close: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  description: {
    marginTop: 40,
    fontSize: 14,
    color: colors.smoke,
    textAlign: "center",
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
});

export default withOnboardingContext(OnboardingStepLegacy);
