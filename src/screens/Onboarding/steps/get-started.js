// @flow
import React, { Component, PureComponent } from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";

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
import { deviceNames } from "../../../wording";

const IconPlus = () => <Icon name="plus" color={colors.live} size={16} />;

class OnboardingStepGetStarted extends Component<OnboardingStepProps> {
  onInitialized = async () => {
    await this.props.setOnboardingMode("alreadyInitialized");
    this.props.next();
  };

  onInit = async () => {
    await this.props.setOnboardingMode("full");
    this.props.next();
  };

  onImport = async () => {
    await this.props.setOnboardingMode("qrcode");
    this.props.next();
  };

  onRestore = async () => {
    await this.props.setOnboardingMode("restore");
    this.props.next();
  };

  render() {
    return (
      <OnboardingLayout header="OnboardingStepGetStarted">
        <TrackScreen category="Onboarding" name="GetStarted" />

        <LText style={styles.subtitle} secondary semiBold>
          <Trans
            i18nKey="onboarding.stepGetStarted.withNanoX"
            values={deviceNames.nanoX}
          />
        </LText>
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

        <LText style={[styles.subtitle, styles.extraMargin]} secondary semiBold>
          <Trans
            i18nKey="onboarding.stepGetStarted.withoutNanoX"
            values={deviceNames.nanoX}
          />
        </LText>
        <Row
          id="import"
          Icon={IconImport}
          label={<Trans i18nKey="onboarding.stepGetStarted.import" />}
          onPress={this.onImport}
        />
        <Touchable
          event="BuyNanoX"
          style={styles.footer}
          onPress={() => Linking.openURL(urls.buyNanoX)}
        >
          <LText style={styles.footerText} semiBold>
            <Trans
              i18nKey="onboarding.stepGetStarted.buy"
              values={deviceNames.nanoX}
            />
          </LText>
          <Icon size={16} name="chevron-right" color={colors.live} />
        </Touchable>
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
});

export default withOnboardingContext(OnboardingStepGetStarted);
