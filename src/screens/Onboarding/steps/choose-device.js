// @flow

import React, { Component, PureComponent } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";

import LText from "../../../components/LText";
import Button from "../../../components/Button";
import BottomModal from "../../../components/BottomModal";
import OnboardingLayout from "../OnboardingLayout";
import { withOnboardingContext } from "../onboardingContext";
import NanoSVertical from "../assets/NanoSVertical";
import NanoXVertical from "../assets/NanoXVertical";
import Blue from "../assets/Blue";
import colors from "../../../colors";
import { deviceNames } from "../../../wording";

import type { OnboardingStepProps } from "../types";

type State = {
  isModalOpened: boolean,
  device: string,
};

class OnboardingStepChooseDevice extends Component<OnboardingStepProps, State> {
  state = {
    isModalOpened: false,
    device: "nanoS",
  };

  open = device => this.setState({ isModalOpened: true, device });
  close = () => this.setState({ isModalOpened: false });
  openForNanoS = () => this.open("nanoS");
  openForBlue = () => this.open("blue");
  scanQR = async () => {
    this.close();
    await this.props.setOnboardingMode("qrcode");
    this.props.navigation.navigate("OnboardingStepScanQR");
  };

  render() {
    const { next } = this.props;
    const { isModalOpened, device } = this.state;
    const modalValues = {
      oldDeviceName: deviceNames[device].fullDeviceName,
      fullDeviceName: deviceNames.nanoX.fullDeviceName,
    };
    return (
      <OnboardingLayout header="OnboardingStepChooseDevice">
        <DeviceItem
          title={deviceNames.nanoX.fullDeviceName}
          onPress={next}
          Icon={NanoSVertical}
        />
        <DeviceItem
          title={deviceNames.nanoS.fullDeviceName}
          desc={<Trans i18nKey="onboarding.stepChooseDevice.desktopOnly" />}
          onPress={this.openForNanoS}
          Icon={NanoXVertical}
        />
        <DeviceItem
          title={deviceNames.blue.fullDeviceName}
          desc={<Trans i18nKey="onboarding.stepChooseDevice.desktopOnly" />}
          onPress={this.openForBlue}
          Icon={Blue}
        />
        <BottomModal isOpened={isModalOpened} onClose={this.close}>
          <LText style={styles.modalTitle} semiBold>
            <Trans
              i18nKey="onboarding.stepChooseDevice.fallbackTitle"
              values={modalValues}
            />
          </LText>
          <LText style={styles.modalDesc}>
            <Trans
              i18nKey="onboarding.stepChooseDevice.fallbackDesc"
              values={modalValues}
            />
          </LText>
          <View style={styles.modalActions}>
            <Button
              type="secondary"
              title={<Trans i18nKey="common.back" />}
              onPress={this.close}
              containerStyle={styles.modalAction}
            />
            <Button
              type="primary"
              title={<Trans i18nKey="addAccountsModal.ctaAdd" />}
              onPress={this.scanQR}
              containerStyle={styles.modalAction}
            />
          </View>
        </BottomModal>
      </OnboardingLayout>
    );
  }
}

type DeviceItemProps = {
  title: string,
  desc?: React$Element<*>,
  onPress?: () => void,
  Icon: React$ComponentType<*>,
};

class DeviceItem extends PureComponent<DeviceItemProps> {
  render() {
    const { title, desc, onPress, Icon } = this.props;
    return (
      <TouchableOpacity onPress={onPress} style={styles.deviceItem}>
        <Icon />
        <LText style={styles.deviceTitle}>{title}</LText>
        {desc && <LText style={styles.deviceDesc}>{desc}</LText>}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  deviceItem: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.fog,
    marginBottom: 8,
    borderRadius: 4,
  },
  deviceTitle: {
    marginTop: 16,
    fontSize: 16,
    color: colors.darkBlue,
  },
  deviceDesc: {
    marginTop: 8,
    fontSize: 14,
    color: colors.grey,
  },
  modalTitle: {
    fontSize: 14,
    color: colors.darkBlue,
    marginVertical: 24,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 14,
    color: colors.smoke,
    paddingHorizontal: 16,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    paddingTop: 24,
    paddingHorizontal: 8,
  },
  modalAction: {
    marginHorizontal: 8,
    flexGrow: 1,
  },
});

export default withOnboardingContext(OnboardingStepChooseDevice);
